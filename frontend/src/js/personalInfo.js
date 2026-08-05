/* personalInfo.js — Ver y editar perfil de un empleado
 * Lee el parámetro ?id= de la URL, carga los datos del empleado
 * y los cargos desde la API, y permite editar y guardar cambios.
 */

// ─── Estado del módulo ───────────────────────────────────────
let empleadoActual = null;   // datos originales del servidor
let modoEdicion = false;     // toggle vista / edición

// ─── Inicialización ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();

  const id = obtenerIdDesdeURL();
  if (!id) {
    mostrarError("No se proporcionó un ID de empleado en la URL.");
    return;
  }

  // Cargar empleado y cargos en paralelo
  try {
    const [empleadoResp, cargosResp] = await Promise.all([
      window.API.Empleados.obtener(id),
      window.API.Cargos.listar(),
    ]);

    // Normalizar respuestas (el backend puede envolver en { data: ... })
    empleadoActual = empleadoResp?.data ?? empleadoResp;
    const cargos = Array.isArray(cargosResp)
      ? cargosResp
      : (cargosResp?.data ?? []);

    poblarSelectCargos(cargos, empleadoActual.id_cargo);
    poblarFormulario(empleadoActual);
    mostrarPerfil();
    lucide.createIcons(); // re-render icons inside dynamic content

  } catch (error) {
    console.error("Error al cargar perfil:", error);
    mostrarError(
      error?.data?.message ||
      error?.message ||
      "No se pudo cargar la información del empleado."
    );
  }

  // Configurar eventos del formulario
  setupEvents(id);
});

// ─── Obtener ID desde ?id= ────────────────────────────────────
function obtenerIdDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || null;
}

// ─── Poblar el select de Cargos ───────────────────────────────
function poblarSelectCargos(cargos, idCargoActual) {
  const select = document.getElementById("id_cargo");
  select.innerHTML = "";

  if (!cargos.length) {
    select.innerHTML = `<option value="" disabled>No hay cargos disponibles</option>`;
    return;
  }

  cargos.forEach((cargo) => {
    const opt = document.createElement("option");
    opt.value = cargo.id ?? cargo.cargo_id;
    opt.textContent = cargo.nombre ?? cargo.name ?? `Cargo #${opt.value}`;
    select.appendChild(opt);
  });

  // Seleccionar el cargo actual del empleado
  if (idCargoActual) {
    select.value = idCargoActual;
  }
}

// ─── Rellenar el formulario con datos del empleado ────────────
function poblarFormulario(emp) {
  // Avatar e iniciales
  const iniciales = `${emp.nombres?.[0] ?? ""}${emp.apellidos?.[0] ?? ""}`.toUpperCase();
  document.getElementById("avatarDisplay").textContent = iniciales;

  // Header
  document.getElementById("headerNombreCompleto").textContent =
    `${emp.nombres} ${emp.apellidos}`;
  document.getElementById("headerCargoCodigo").textContent =
    `${emp.cargo_nombre ?? "—"} • ${emp.codigo_empleado ?? "—"}`;

  // Status pill
  const statusPill = document.getElementById("statusPill");
  const estadoNorm = (emp.estado ?? "").toLowerCase();
  statusPill.className = `status-pill ${estadoNorm || "inactivo"}`;
  document.getElementById("statusText").textContent =
    emp.estado
      ? emp.estado.charAt(0).toUpperCase() + emp.estado.slice(1)
      : "—";

  // Barra de horario (si el cargo tiene horario)
  if (emp.horario_entrada || emp.horario_salida) {
    document.getElementById("metaEntrada").textContent =
      formatHora(emp.horario_entrada);
    document.getElementById("metaSalida").textContent =
      formatHora(emp.horario_salida);
    document.getElementById("metaBar").style.display = "flex";
  }

  // Campos del formulario
  setValue("codigo_empleado", emp.codigo_empleado);
  setValue("cedula", emp.cedula);
  setValue("nombres", emp.nombres);
  setValue("apellidos", emp.apellidos);
  setValue("id_cargo", emp.id_cargo);   // el select ya tiene las opciones
  setValue("estado", emp.estado ?? "activo");
  setValue("fecha_contratacion", emp.fecha_contratacion?.split("T")[0] ?? "");
  setValue("salario_base", emp.salario_base ?? "");
  setValue("telefono", emp.telefono ?? "");
  document.getElementById("direccion").value = emp.direccion ?? "";
}

// ─── Helper: asignar valor a input/select ─────────────────────
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

// ─── Helper: formatear hora HH:MM:SS → HH:MM ─────────────────
function formatHora(hora) {
  if (!hora) return "—";
  return hora.slice(0, 5); // "08:00:00" → "08:00"
}

// ─── Mostrar el perfil (ocultar loading) ─────────────────────
function mostrarPerfil() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "none";
  document.getElementById("profileCard").style.display = "block";
}

// ─── Mostrar estado de error ──────────────────────────────────
function mostrarError(msg) {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorMessage").textContent = msg;
  document.getElementById("errorState").style.display = "block";
  lucide.createIcons();
}

// ─── Toggle modo edición / vista ──────────────────────────────
function activarEdicion() {
  modoEdicion = true;
  const campos = document.querySelectorAll(
    "#employeeForm input, #employeeForm select, #employeeForm textarea"
  );
  campos.forEach((el) => (el.disabled = false));

  document.getElementById("formActions").classList.add("visible");
  const btn = document.getElementById("btnToggleEdit");
  btn.classList.add("editing");
  document.getElementById("btnEditText").textContent = "Editando...";
}

function desactivarEdicion() {
  modoEdicion = false;
  const campos = document.querySelectorAll(
    "#employeeForm input, #employeeForm select, #employeeForm textarea"
  );
  campos.forEach((el) => (el.disabled = true));

  document.getElementById("formActions").classList.remove("visible");
  const btn = document.getElementById("btnToggleEdit");
  btn.classList.remove("editing");
  document.getElementById("btnEditText").textContent = "Editar Información";
}

// ─── Configurar todos los eventos ────────────────────────────
function setupEvents(empleadoId) {
  // Botón Editar / Cancelar edición
  document.getElementById("btnToggleEdit").addEventListener("click", () => {
    if (modoEdicion) {
      // Revertir sin guardar
      poblarFormulario(empleadoActual);
      desactivarEdicion();
    } else {
      activarEdicion();
    }
  });

  // Botón Cancelar dentro del form
  document.getElementById("btnCancelEdit").addEventListener("click", () => {
    poblarFormulario(empleadoActual);
    desactivarEdicion();
  });

  // Submit: guardar cambios
  document.getElementById("employeeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById("btnSave");
    btnSave.disabled = true;

    const loader = window.showLoader("Guardando cambios...");

    // Construir payload con solo los campos editables (updateEmpleadoSchema)
    const payload = {
      id_cargo: document.getElementById("id_cargo").value || undefined,
      codigo_empleado: document.getElementById("codigo_empleado").value.trim() || undefined,
      cedula: document.getElementById("cedula").value.trim() || undefined,
      nombres: document.getElementById("nombres").value.trim() || undefined,
      apellidos: document.getElementById("apellidos").value.trim() || undefined,
      telefono: document.getElementById("telefono").value.trim() || null,
      direccion: document.getElementById("direccion").value.trim() || null,
      fecha_contratacion: document.getElementById("fecha_contratacion").value || undefined,
      salario_base: parseFloat(document.getElementById("salario_base").value) || undefined,
      estado: document.getElementById("estado").value || undefined,
    };

    try {
      const respuesta = await window.API.Empleados.actualizar(empleadoId, payload);
      empleadoActual = respuesta?.data ?? respuesta; // Actualizar cache local

      window.hideLoader();
      window.showSuccess(
        "Cambios guardados",
        `El perfil de ${empleadoActual.nombres} fue actualizado.`
      );

      // Actualizar el header del perfil con los nuevos datos
      poblarFormulario(empleadoActual);
      desactivarEdicion();
      lucide.createIcons();

    } catch (error) {
      window.hideLoader();
      console.error("Error al actualizar empleado:", error);
      window.showError(
        "Error al guardar",
        error?.data?.message || error?.message || "No se pudo actualizar el empleado."
      );
    } finally {
      btnSave.disabled = false;
    }
  });
}
