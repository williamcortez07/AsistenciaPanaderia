/* ============================================================
   MÓDULO DE PLANILLA Y NÓMINA - PANADERÍA CENTRAL (NICARAGUA)
   ============================================================ */

let planillaCalculada = [];

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  // Escuchar eventos de controles
  document.getElementById("btnCalcular").addEventListener("click", () => {
    const mes = parseInt(document.getElementById("selectMes").value, 10);
    const anio = parseInt(document.getElementById("selectAnio").value, 10);
    const quincena = document.getElementById("selectQuincena").value;
    cargarPlanilla(mes, anio, quincena);
  });

  document.getElementById("btnGuardar").addEventListener("click", guardarPlanillaEnSistema);

  document.getElementById("btnImprimir").addEventListener("click", () => {
    window.print();
  });

  // Carga inicial automatica con los valores seleccionados
  const mesActual = parseInt(document.getElementById("selectMes").value, 10);
  const anioActual = parseInt(document.getElementById("selectAnio").value, 10);
  const quincenaActual = document.getElementById("selectQuincena").value;
  cargarPlanilla(mesActual, anioActual, quincenaActual);
});

/* ─── Cargar y Calcular Planilla ─── */
async function cargarPlanilla(mes, anio, quincena) {
  const loading = document.getElementById("loadingState");
  const sheet = document.getElementById("planillaSheet");
  
  if (loading) loading.style.display = "block";
  if (sheet) sheet.style.opacity = "0.5";

  actualizarBannerFechas(mes, anio, quincena);

  try {
    // 1. Llamadas en paralelo a los endpoints con fallback seguro
    const [resEmp, resAsist, resVac] = await Promise.all([
      window.API.Empleados.listar({ limit: 100 }),
      window.API.Asistencia.listar({ limit: 100 }).catch(() => ({ data: [] })),
      window.API.Vacaciones.listar({ limit: 100 }).catch(() => ({ data: [] })),
    ]);

    const empleados = Array.isArray(resEmp) ? resEmp : (resEmp?.data ?? []);
    const asistencias = Array.isArray(resAsist) ? resAsist : (resAsist?.data ?? []);
    const vacaciones = Array.isArray(resVac) ? resVac : (resVac?.data ?? []);

    if (!empleados.length) {
      window.showToast?.("Atención", "No hay empleados registrados en el sistema.", "warning");
    }

    // 2. Cruzar información por ID de empleado y calcular montos
    planillaCalculada = empleados.map((emp) => {
      // Filtrar registros de asistencia correspondientes al empleado
      const asistEmp = asistencias.filter(
        (a) => (a.id_empleado ?? a.empleado_id) === emp.id
      );

      // Calcular horas extras acumuladas (si no viene explicito, se calcula de asistencias o fallback)
      let horasExtrasCount = 0;
      asistEmp.forEach((a) => {
        if (a.horas_extras) horasExtrasCount += Number(a.horas_extras);
      });

      // Cálculo de leyes laborales Nicaragua
      const salarioBasico = Number(emp.salario_base ?? emp.salario_basico ?? 0);
      
      // Horas extras: pago doble (SalarioHora = salarioBasico / 24 días / 8 hrs * 2)
      const valorHoraNormal = salarioBasico > 0 ? salarioBasico / 24 / 8 : 0;
      const pagoHorasExtras = Math.round(horasExtrasCount * valorHoraNormal * 2 * 100) / 100;

      // Antigüedad (años trabajados y % aplicable)
      const { anos, porcentaje } = calcularAntiguedad(emp.fecha_contratacion ?? emp.fecha_ingreso);
      const montoAntiguedad = Math.round(salarioBasico * (porcentaje / 100) * 100) / 100;

      // Total Devengado
      const totalDevengado = Math.round((salarioBasico + pagoHorasExtras + montoAntiguedad) * 100) / 100;

      // Deducciones de Ley (Nicaragua)
      const inssLaboral = Math.round(totalDevengado * 0.07 * 100) / 100; // 7%
      const baseImponibleIR = totalDevengado - inssLaboral;
      const irMensual = calcularIRNicaragua(baseImponibleIR);

      const totalDeducciones = Math.round((inssLaboral + irMensual) * 100) / 100;
      const totalAPagar = Math.max(0, Math.round((totalDevengado - totalDeducciones) * 100) / 100);

      // Cargas Patronales (Nicaragua)
      const inssPatronal = Math.round(totalDevengado * 0.225 * 100) / 100; // 22.5%
      const inatec = Math.round(totalDevengado * 0.02 * 100) / 100;       // 2%
      const provVacaciones = Math.round(totalDevengado * 0.083333 * 100) / 100; // 8.33%
      const provAguinaldo = Math.round(totalDevengado * 0.083333 * 100) / 100;  // 8.33%
      const totalPrestaciones = Math.round((provVacaciones + provAguinaldo + inssPatronal + inatec) * 100) / 100;

      return {
        id: emp.id,
        nombres: emp.nombres ?? "",
        apellidos: emp.apellidos ?? "",
        nombreCompleto: `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim(),
        cargo: emp.cargo_nombre ?? emp.cargo ?? "Empleado",
        salarioBasico,
        horasExtrasCount,
        pagoHorasExtras,
        antiguedadAnos: anos,
        antiguedadPorcentaje: porcentaje,
        montoAntiguedad,
        totalDevengado,
        inssLaboral,
        irMensual,
        totalDeducciones,
        totalAPagar,
        inssPatronal,
        inatec,
        provVacaciones,
        provAguinaldo,
        totalPrestaciones,
      };
    });

    renderizarTablaHTML(planillaCalculada);

  } catch (error) {
    console.error("Error al cargar planilla:", error);
    window.showError?.("Error", "Ocurrió un error al procesar la planilla.");
  } finally {
    if (loading) loading.style.display = "none";
    if (sheet) sheet.style.opacity = "1";
    lucide.createIcons();
  }
}

/* ─── Renderizar Tablas HTML ─── */
function renderizarTablaHTML(planilla) {
  const tbodyNomina = document.getElementById("tbodyNomina");
  const tbodyPrestaciones = document.getElementById("tbodyPrestaciones");

  tbodyNomina.innerHTML = "";
  tbodyPrestaciones.innerHTML = "";

  if (!planilla.length) {
    tbodyNomina.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:1.5rem;">No hay datos para mostrar</td></tr>`;
    tbodyPrestaciones.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;">No hay datos para mostrar</td></tr>`;
    resetearTotales();
    return;
  }

  // Acumuladores de totales
  let sumSalarioBasico = 0;
  let sumHorasExtras = 0;
  let sumDevengado = 0;
  let sumInssLaboral = 0;
  let sumIrMensual = 0;
  let sumDeducciones = 0;
  let sumAPagar = 0;

  let sumVacaciones = 0;
  let sumAguinaldo = 0;
  let sumInssPatronal = 0;
  let sumInatec = 0;
  let sumTotalPrestaciones = 0;

  planilla.forEach((item, index) => {
    sumSalarioBasico += item.salarioBasico;
    sumHorasExtras += item.pagoHorasExtras;
    sumDevengado += item.totalDevengado;
    sumInssLaboral += item.inssLaboral;
    sumIrMensual += item.irMensual;
    sumDeducciones += item.totalDeducciones;
    sumAPagar += item.totalAPagar;

    sumVacaciones += item.provVacaciones;
    sumAguinaldo += item.provAguinaldo;
    sumInssPatronal += item.inssPatronal;
    sumInatec += item.inatec;
    sumTotalPrestaciones += item.totalPrestaciones;

    // Fila Nómina Principal
    const trNomina = document.createElement("tr");
    trNomina.innerHTML = `
      <td>${index + 1}</td>
      <td class="text-left"><strong>${item.nombreCompleto}</strong></td>
      <td class="text-left">${item.cargo}</td>
      <td class="text-right">${formatCordobas(item.salarioBasico)}</td>
      <td class="text-right">${formatCordobas(item.pagoHorasExtras)}</td>
      <td>${item.antiguedadAnos}</td>
      <td>${item.antiguedadPorcentaje}%</td>
      <td class="text-right"><strong>${formatCordobas(item.totalDevengado)}</strong></td>
      <td class="text-right">${formatCordobas(item.inssLaboral)}</td>
      <td class="text-right">${formatCordobas(item.irMensual)}</td>
      <td class="text-right">${formatCordobas(item.totalDeducciones)}</td>
      <td class="text-right"><strong>${formatCordobas(item.totalAPagar)}</strong></td>
      <td class="signature-col"></td>
    `;
    tbodyNomina.appendChild(trNomina);

    // Fila Prestaciones / Cargas Patronales
    const trPrestaciones = document.createElement("tr");
    trPrestaciones.innerHTML = `
      <td class="text-right">${formatCordobas(item.provVacaciones)}</td>
      <td class="text-right">${formatCordobas(item.provAguinaldo)}</td>
      <td class="text-right">${formatCordobas(item.inssPatronal)}</td>
      <td class="text-right">${formatCordobas(item.inatec)}</td>
      <td class="text-right"><strong>${formatCordobas(item.totalPrestaciones)}</strong></td>
    `;
    tbodyPrestaciones.appendChild(trPrestaciones);
  });

  // Actualizar Totales en tfoot
  document.getElementById("totSalarioBasico").textContent = formatCordobas(sumSalarioBasico);
  document.getElementById("totHorasExtras").textContent = formatCordobas(sumHorasExtras);
  document.getElementById("totDevengado").textContent = formatCordobas(sumDevengado);
  document.getElementById("totInssLaboral").textContent = formatCordobas(sumInssLaboral);
  document.getElementById("totIrMensual").textContent = formatCordobas(sumIrMensual);
  document.getElementById("totDeducciones").textContent = formatCordobas(sumDeducciones);
  document.getElementById("totAPagar").textContent = formatCordobas(sumAPagar);

  document.getElementById("totVacaciones").textContent = formatCordobas(sumVacaciones);
  document.getElementById("totAguinaldo").textContent = formatCordobas(sumAguinaldo);
  document.getElementById("totInssPatronal").textContent = formatCordobas(sumInssPatronal);
  document.getElementById("totInatec").textContent = formatCordobas(sumInatec);
  document.getElementById("totTotalPrestaciones").textContent = formatCordobas(sumTotalPrestaciones);
}

function resetearTotales() {
  const ids = [
    "totSalarioBasico", "totHorasExtras", "totDevengado", "totInssLaboral",
    "totIrMensual", "totDeducciones", "totAPagar", "totVacaciones",
    "totAguinaldo", "totInssPatronal", "totInatec", "totTotalPrestaciones"
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "C$ 0.00";
  });
}

/* ─── Formateador de Moneda Córdobas (C$) ─── */
function formatCordobas(monto) {
  const val = Number(monto) || 0;
  return "C$ " + val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── Cálculo de Antigüedad laboral en Nicaragua ─── */
function calcularAntiguedad(fechaContratacion) {
  if (!fechaContratacion) return { anos: 0, porcentaje: 0 };
  const inicio = new Date(fechaContratacion);
  const hoy = new Date();
  if (isNaN(inicio.getTime())) return { anos: 0, porcentaje: 0 };

  let anos = hoy.getFullYear() - inicio.getFullYear();
  const m = hoy.getMonth() - inicio.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < inicio.getDate())) {
    anos--;
  }

  if (anos < 1) return { anos: 0, porcentaje: 0 };

  // Tabla estándar de porcentaje por antigüedad en Nicaragua
  let porcentaje = 0;
  if (anos === 1) porcentaje = 3;
  else if (anos === 2) porcentaje = 5;
  else if (anos === 3) porcentaje = 7;
  else if (anos === 4) porcentaje = 9;
  else if (anos >= 5 && anos <= 9) porcentaje = 10 + (anos - 5); // 5->10%, 6->11%, 7->12%, 8->13%, 9->14%
  else if (anos >= 10 && anos < 20) porcentaje = 15;
  else if (anos >= 20) porcentaje = 20;

  return { anos, porcentaje };
}

/* ─── Cálculo de IR (Impuesto sobre la Renta) Nicaragua - Ley 822 ─── */
function calcularIRNicaragua(baseImponibleMensual) {
  if (baseImponibleMensual <= 0) return 0;
  const baseAnual = baseImponibleMensual * 12;
  let irAnual = 0;

  if (baseAnual <= 100000) {
    irAnual = 0; // Exento
  } else if (baseAnual <= 200000) {
    irAnual = (baseAnual - 100000) * 0.15;
  } else if (baseAnual <= 350000) {
    irAnual = 15000 + (baseAnual - 200000) * 0.20;
  } else if (baseAnual <= 500000) {
    irAnual = 45000 + (baseAnual - 350000) * 0.25;
  } else {
    irAnual = 82500 + (baseAnual - 500000) * 0.30;
  }

  const irMensual = irAnual / 12;
  return Math.max(0, Math.round(irMensual * 100) / 100);
}

/* ─── Actualizar banner de periodo ─── */
function actualizarBannerFechas(mes, anio, quincena) {
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const nombreMes = nombresMeses[mes - 1] || "Mes";

  let inicio = "01";
  let fin = "15";

  if (quincena === "1") {
    inicio = "01";
    fin = "15";
  } else if (quincena === "2") {
    inicio = "16";
    fin = new Date(anio, mes, 0).getDate().toString();
  } else {
    inicio = "01";
    fin = new Date(anio, mes, 0).getDate().toString();
  }

  document.getElementById("lblFechaInicio").textContent = inicio;
  document.getElementById("lblFechaFin").textContent = fin;
  document.getElementById("lblNombreMes").textContent = nombreMes;
  document.getElementById("lblAnioNum").textContent = anio.toString();
}

/* ─── Guardar Planilla Calculada en la API ─── */
async function guardarPlanillaEnSistema() {
  const mes = parseInt(document.getElementById("selectMes").value, 10);
  const anio = parseInt(document.getElementById("selectAnio").value, 10);

  const loader = window.showLoader?.("Guardando planilla en la base de datos...");

  try {
    const payload = {
      mes,
      anio,
      detalles: planillaCalculada,
    };
    await window.API.Planilla.crear(payload);
    window.hideLoader?.();
    window.showSuccess?.("Planilla Guardada", `La planilla de ${mes}/${anio} ha sido registrada con éxito.`);
  } catch (error) {
    window.hideLoader?.();
    console.error("Error al guardar planilla:", error);
    window.showError?.(
      "Error al guardar",
      error?.data?.message || error?.message || "No se pudo registrar la planilla en el servidor."
    );
  }
}
