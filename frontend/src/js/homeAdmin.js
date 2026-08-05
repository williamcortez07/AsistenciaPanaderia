document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  cargarInfoUsuario();
  iniciarCountdownQR();

  // Event handlers para formularios en modales
  const formRol = document.getElementById("formCrearRol");
  if (formRol) {
    formRol.addEventListener("submit", guardarNuevoRol);
  }

  const formCargo = document.getElementById("formCrearCargo");
  if (formCargo) {
    formCargo.addEventListener("submit", guardarNuevoCargo);
  }

  const formVac = document.getElementById("formCrearVacaciones");
  if (formVac) {
    formVac.addEventListener("submit", guardarNuevaVacacion);
  }
});

function cargarInfoUsuario() {
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return;

    const user = JSON.parse(raw);
    const nombreEl = document.querySelector(".user-profile strong");
    if (nombreEl && user) {
      const nombre =
        user.nombre ||
        user.nombres ||
        user.name ||
        user.correo ||
        user.email ||
        "Administrador";
      nombreEl.textContent = nombre;
    }
  } catch (e) {
    console.warn("No se pudo cargar info del usuario:", e);
  }
}

// ─── Modal 1: Generador QR Dinámico con expiración ─────────────
let _qrTimer = null;
const QR_TTL_SECONDS = 60;

function generarPayloadQR() {
  const ahora = Date.now();
  return JSON.stringify({
    type: "asistencia-panaderia",
    iat: ahora,
    exp: ahora + QR_TTL_SECONDS * 1000,
  });
}

async function renderizarQR() {
  const canvas = document.getElementById("qrAdminCanvas");
  if (!canvas) return;

  const payload = generarPayloadQR();

  try {
    await QRCode.toCanvas(canvas, payload, {
      width: 220,
      margin: 2,
      color: {
        dark: "#5c3317",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Error al generar QR:", err);
  }
}

function abrirModalQR() {
  const modal = document.getElementById("modalQR");
  if (!modal) return;
  modal.style.display = "flex";
  lucide.createIcons();
  iniciarCicloQR();
}

function cerrarModalQR() {
  const modal = document.getElementById("modalQR");
  if (!modal) return;
  modal.style.display = "none";
  if (_qrTimer) {
    clearInterval(_qrTimer);
    _qrTimer = null;
  }
}

function iniciarCicloQR() {
  // Generar QR inmediatamente
  renderizarQR();

  let segsRestantes = QR_TTL_SECONDS;
  const spanSegs = document.getElementById("segundos");
  if (spanSegs) spanSegs.textContent = segsRestantes;

  if (_qrTimer) clearInterval(_qrTimer);

  _qrTimer = setInterval(async () => {
    segsRestantes--;

    if (spanSegs) {
      spanSegs.textContent = segsRestantes;
      // Poner en rojo cuando quedan menos de 10s
      spanSegs.className = segsRestantes <= 10 ? "countdown-num danger" : "countdown-num";
    }

    if (segsRestantes <= 0) {
      segsRestantes = QR_TTL_SECONDS;
      await renderizarQR();
    }
  }, 1000);
}

// Alias legacy por si algún HTML todavía usa iniciarCountdownQR
function iniciarCountdownQR() { iniciarCicloQR(); }

// ─── Modal 2: Roles y Cargos ──────────────────────────────────
function abrirModalRolesCargos() {
  const modal = document.getElementById("modalRolesCargos");
  if (!modal) return;
  modal.style.display = "flex";
  cargarRolesTable();
  cargarCargosTable();
  lucide.createIcons();
}

function cerrarModalRolesCargos() {
  const modal = document.getElementById("modalRolesCargos");
  if (modal) modal.style.display = "none";
}

function cambiarTabModal(tab) {
  const tabRoles = document.getElementById("tabContentRoles");
  const tabCargos = document.getElementById("tabContentCargos");
  const btnRoles = document.getElementById("tabBtnRoles");
  const btnCargos = document.getElementById("tabBtnCargos");

  if (tab === "roles") {
    tabRoles.style.display = "block";
    tabCargos.style.display = "none";
    btnRoles.classList.add("active");
    btnCargos.classList.remove("active");
  } else {
    tabRoles.style.display = "none";
    tabCargos.style.display = "block";
    btnRoles.classList.remove("active");
    btnCargos.classList.add("active");
  }
}

async function cargarRolesTable() {
  const tbody = document.getElementById("tbodyRoles");
  if (!tbody) return;
  try {
    const res = await window.API.Roles.listar();
    const roles = Array.isArray(res) ? res : (res?.data ?? []);
    if (!roles.length) {
      tbody.innerHTML = `<tr><td colspan="3">No hay roles registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = roles
      .map(
        (r) => `
      <tr>
        <td><code>${r.id ?? r.rol_id ?? "-"}</code></td>
        <td><strong>${r.nombre ?? r.name ?? "-"}</strong></td>
        <td>${r.descripcion ?? r.description ?? "-"}</td>
      </tr>
    `
      )
      .join("");
  } catch (e) {
    console.error("Error al cargar roles:", e);
    tbody.innerHTML = `<tr><td colspan="3">Error al cargar roles.</td></tr>`;
  }
}

async function guardarNuevoRol(e) {
  e.preventDefault();
  const name = document.getElementById("rolNombre").value.trim();
  const description = document.getElementById("rolDescripcion").value.trim() || undefined;
  if (!name) return;

  const loader = window.showLoader("Guardando rol...");
  try {
    await window.API.Roles.crear({ name, description });
    window.hideLoader();
    window.showSuccess("Rol registrado", `El rol ${name} fue creado con éxito.`);
    document.getElementById("rolNombre").value = "";
    document.getElementById("rolDescripcion").value = "";
    cargarRolesTable();
  } catch (err) {
    window.hideLoader();
    window.showError("Error", err?.data?.message || err?.message || "No se pudo crear el rol.");
  }
}

async function cargarCargosTable() {
  const tbody = document.getElementById("tbodyCargos");
  if (!tbody) return;
  try {
    const res = await window.API.Cargos.listar();
    const cargos = Array.isArray(res) ? res : (res?.data ?? []);
    if (!cargos.length) {
      tbody.innerHTML = `<tr><td colspan="3">No hay cargos registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = cargos
      .map(
        (c) => `
      <tr>
        <td><strong>${c.nombre ?? c.name ?? "-"}</strong></td>
        <td>${c.horario_entrada ? c.horario_entrada.slice(0, 5) : "08:00"}</td>
        <td>${c.horario_salida ? c.horario_salida.slice(0, 5) : "17:00"}</td>
      </tr>
    `
      )
      .join("");
  } catch (e) {
    console.error("Error al cargar cargos:", e);
    tbody.innerHTML = `<tr><td colspan="3">Error al cargar cargos.</td></tr>`;
  }
}

async function guardarNuevoCargo(e) {
  e.preventDefault();
  const name = document.getElementById("cargoNombre").value.trim();
  const description = document.getElementById("cargoDescripcion").value.trim() || undefined;
  const horario_entrada = document.getElementById("cargoEntrada").value || undefined;
  const horario_salida = document.getElementById("cargoSalida").value || undefined;
  if (!name) return;

  const loader = window.showLoader("Guardando cargo...");
  try {
    await window.API.Cargos.crear({ name, description, horario_entrada, horario_salida });
    window.hideLoader();
    window.showSuccess("Cargo registrado", `El cargo ${name} fue creado con éxito.`);
    document.getElementById("cargoNombre").value = "";
    document.getElementById("cargoDescripcion").value = "";
    cargarCargosTable();
  } catch (err) {
    window.hideLoader();
    window.showError("Error", err?.data?.message || err?.message || "No se pudo crear el cargo.");
  }
}

// ─── Modal 3: Control de Asistencia y Tardanzas ──────────────
let _asistenciasCache = [];

function abrirModalAsistencia() {
  const modal = document.getElementById("modalAsistencia");
  if (!modal) return;
  modal.style.display = "flex";
  cargarAsistenciaTable();
  lucide.createIcons();
}

function cerrarModalAsistencia() {
  const modal = document.getElementById("modalAsistencia");
  if (modal) modal.style.display = "none";
}

async function cargarAsistenciaTable() {
  const tbody = document.getElementById("tbodyAsistencia");
  if (!tbody) return;

  try {
    const [resEmp, resAsist] = await Promise.all([
      window.API.Empleados.listar({ limit: 100 }),
      window.API.Asistencia.listar({ limit: 100 }).catch(() => ({ data: [] })),
    ]);

    const empleados = Array.isArray(resEmp) ? resEmp : (resEmp?.data ?? []);
    const asistencias = Array.isArray(resAsist) ? resAsist : (resAsist?.data ?? []);

    _asistenciasCache = empleados.map((emp) => {
      const asist = asistencias.find((a) => (a.id_empleado ?? a.empleado_id) === emp.id);

      const horaProgramada = emp.horario_entrada || "08:00";
      let horaReal = "—";
      let estado = "ausente"; // ausente por defecto si no ha marcado
      let badgeLabel = "No se presentó";

      if (asist && (asist.hora_entrada || asist.fecha_hora_entrada || asist.created_at)) {
        const fechaHora = asist.hora_entrada || asist.fecha_hora_entrada || asist.created_at;
        horaReal = typeof fechaHora === "string" && fechaHora.includes("T")
          ? fechaHora.split("T")[1].slice(0, 5)
          : fechaHora.slice(0, 5);

        // Comparar horas para tardanza (> 10 mins de diferencia)
        const [hProg, mProg] = horaProgramada.split(":").map(Number);
        const [hReal, mReal] = horaReal.split(":").map(Number);

        const minsProg = hProg * 60 + mProg;
        const minsReal = hReal * 60 + mReal;

        if (minsReal > minsProg + 10) {
          estado = "tarde";
          const dif = minsReal - minsProg;
          badgeLabel = `Marcó Tarde (+${dif} min)`;
        } else {
          estado = "puntual";
          badgeLabel = "A Tiempo";
        }
      }

      return {
        nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
        cargo: emp.cargo_nombre || emp.cargo || "Empleado",
        horaProgramada,
        horaReal,
        estado,
        badgeLabel,
      };
    });

    renderizarAsistenciaGrid(_asistenciasCache);

  } catch (e) {
    console.error("Error al cargar asistencias:", e);
    tbody.innerHTML = `<tr><td colspan="5">Error al cargar registros.</td></tr>`;
  }
}

function renderizarAsistenciaGrid(items) {
  const tbody = document.getElementById("tbodyAsistencia");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5">No hay empleados registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map(
      (item) => `
    <tr>
      <td><strong>${item.nombreCompleto}</strong></td>
      <td>${item.cargo}</td>
      <td>${item.horaProgramada}</td>
      <td>${item.horaReal}</td>
      <td><span class="badge-status ${item.estado}">${item.badgeLabel}</span></td>
    </tr>
  `
    )
    .join("");
}

function filtrarTablaAsistencia() {
  const filtro = document.getElementById("filtroEstadoAsistencia").value;
  if (filtro === "todos") {
    renderizarAsistenciaGrid(_asistenciasCache);
  } else {
    const filtrados = _asistenciasCache.filter((item) => item.estado === filtro);
    renderizarAsistenciaGrid(filtrados);
  }
}

// ─── Modal 4: Solicitudes de Vacaciones ────────────────────────
function abrirModalVacaciones() {
  const modal = document.getElementById("modalVacaciones");
  if (!modal) return;
  modal.style.display = "flex";
  cargarSelectEmpleadosVacaciones();
  cargarVacacionesTable();
  lucide.createIcons();
}

function cerrarModalVacaciones() {
  const modal = document.getElementById("modalVacaciones");
  if (modal) modal.style.display = "none";
}

async function cargarSelectEmpleadosVacaciones() {
  const select = document.getElementById("vacEmpleadoId");
  if (!select) return;
  try {
    const res = await window.API.Empleados.listar({ limit: 100 });
    const empleados = Array.isArray(res) ? res : (res?.data ?? []);

    select.innerHTML = `<option value="" disabled selected>Selecciona un empleado</option>`;
    empleados.forEach((emp) => {
      const opt = document.createElement("option");
      opt.value = emp.id;
      opt.textContent = `${emp.nombres} ${emp.apellidos} (${emp.codigo_empleado ?? "EMP"})`;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = `<option value="" disabled>Error al cargar empleados</option>`;
  }
}

async function cargarVacacionesTable() {
  const tbody = document.getElementById("tbodyVacaciones");
  if (!tbody) return;

  try {
    const [resVac, resEmp] = await Promise.all([
      window.API.Vacaciones.listar({ limit: 100 }),
      window.API.Empleados.listar({ limit: 100 }),
    ]);

    const vacaciones = Array.isArray(resVac) ? resVac : (resVac?.data ?? []);
    const empleados = Array.isArray(resEmp) ? resEmp : (resEmp?.data ?? []);

    if (!vacaciones.length) {
      tbody.innerHTML = `<tr><td colspan="6">No hay solicitudes de vacaciones registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = vacaciones
      .map((vac) => {
        const emp = empleados.find((e) => e.id === (vac.id_empleado ?? vac.empleado_id));
        const nombreEmp = emp ? `${emp.nombres} ${emp.apellidos}` : "Empleado #" + (vac.id_empleado ?? "");
        const estadoNorm = (vac.estado ?? "pendiente").toLowerCase();
        const estadoLabel = vac.estado
          ? vac.estado.charAt(0).toUpperCase() + vac.estado.slice(1)
          : "Pendiente";

        return `
        <tr>
          <td><strong>${nombreEmp}</strong></td>
          <td>${vac.fecha_inicio ? vac.fecha_inicio.split("T")[0] : "-"}</td>
          <td>${vac.fecha_fin ? vac.fecha_fin.split("T")[0] : "-"}</td>
          <td style="text-align:center;">${vac.dias ?? "-"}</td>
          <td>${vac.motivo ?? "-"}</td>
          <td><span class="badge-status ${estadoNorm}">${estadoLabel}</span></td>
        </tr>
      `;
      })
      .join("");
  } catch (e) {
    console.error("Error al cargar vacaciones:", e);
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar solicitudes.</td></tr>`;
  }
}

async function guardarNuevaVacacion(e) {
  e.preventDefault();
  const id_empleado = document.getElementById("vacEmpleadoId").value;
  const fecha_inicio = document.getElementById("vacFechaInicio").value;
  const fecha_fin = document.getElementById("vacFechaFin").value;
  const motivo = document.getElementById("vacMotivo").value.trim() || undefined;

  if (!id_empleado || !fecha_inicio || !fecha_fin) return;

  // Calcular número de días hábiles entre fechas (requerido por el backend)
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const dias = Math.max(1, Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1);

  if (fin < inicio) {
    window.showError("Fechas inválidas", "La fecha de fin no puede ser anterior a la fecha de inicio.");
    return;
  }

  const loader = window.showLoader("Registrando vacaciones...");
  try {
    await window.API.Vacaciones.crear({ id_empleado, fecha_inicio, fecha_fin, dias, motivo });
    window.hideLoader();
    window.showSuccess("Solicitud Registrada", `Vacaciones registradas: ${dias} día(s).`);
    document.getElementById("vacFechaInicio").value = "";
    document.getElementById("vacFechaFin").value = "";
    document.getElementById("vacMotivo").value = "";
    cargarVacacionesTable();
  } catch (err) {
    window.hideLoader();
    window.showError("Error", err?.data?.message || err?.message || "No se pudo registrar la solicitud.");
  }
}

// Exponer funciones globales para onclicks en el HTML
window.abrirModalQR = abrirModalQR;
window.cerrarModalQR = cerrarModalQR;

window.abrirModalRolesCargos = abrirModalRolesCargos;
window.cerrarModalRolesCargos = cerrarModalRolesCargos;
window.cambiarTabModal = cambiarTabModal;

window.abrirModalAsistencia = abrirModalAsistencia;
window.cerrarModalAsistencia = cerrarModalAsistencia;
window.filtrarTablaAsistencia = filtrarTablaAsistencia;

window.abrirModalVacaciones = abrirModalVacaciones;
window.cerrarModalVacaciones = cerrarModalVacaciones;
window.cambiarEstadoVacacion = cambiarEstadoVacacion;
