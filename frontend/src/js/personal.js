let todosLosEmpleados = [];
let usuarioIdCreado = null;

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  await cargarEmpleados();

  document
    .getElementById("searchInput")
    .addEventListener("input", filtrarEmpleados);

  setupModalEvents();
});

async function cargarEmpleados() {
  const container = document.getElementById("employeesContainer");
  container.innerHTML = `
    <div class="state-message">
      <p>Cargando personal de la panadería...</p>
    </div>`;

  try {
    const respuesta = await window.API.Empleados.listar();
    todosLosEmpleados = Array.isArray(respuesta)
      ? respuesta
      : (respuesta?.data ?? []);
    renderizarTarjetas(todosLosEmpleados);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    container.innerHTML = `
      <div class="state-message">
        <i data-lucide="alert-circle"
           style="color: var(--rojo-suave); width: 32px; height: 32px; margin-bottom: 0.5rem;">
        </i>
        <p>No se pudo cargar la lista de empleados.</p>
      </div>`;
    lucide.createIcons();
  }
}
function renderizarTarjetas(empleados) {
  const container = document.getElementById("employeesContainer");
  container.innerHTML = "";

  if (!empleados.length) {
    container.innerHTML = `<div class="state-message"><p>No se encontraron empleados.</p></div>`;
    return;
  }

  empleados.forEach((emp) => {
    const iniciales =
      `${emp.nombres?.[0] ?? ""}${emp.apellidos?.[0] ?? ""}`.toUpperCase();
    const esActivo =
      emp.estado === true ||
      (typeof emp.estado === "string" && emp.estado.toLowerCase() === "activo");
    const badgeClass = esActivo ? "status-activo" : "status-inactivo";
    const statusText = esActivo ? "Activo" : "Inactivo";

    const card = document.createElement("article");
    card.className = "employee-card";
    card.onclick = () => {
      window.location.href = `/personal/detalle?id=${emp.id}`;
    };

    card.innerHTML = `
      <div>
        <div class="card-header-info">
          <div class="avatar">${iniciales}</div>
          <div class="employee-details">
            <h3>${emp.nombres} ${emp.apellidos}</h3>
            <span class="role">${emp.cargo || emp.rol || "Panadero"}</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <span class="status-badge ${badgeClass}">
          <span style="width:6px;height:6px;border-radius:50%;background-color:currentColor;"></span>
          ${statusText}
        </span>
        <span class="action-link">
          Ver perfil <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>
        </span>
      </div>`;

    container.appendChild(card);
  });

  lucide.createIcons();
}
function filtrarEmpleados(e) {
  const texto = e.target.value.toLowerCase().trim();
  const filtrados = todosLosEmpleados.filter((emp) => {
    const nombreCompleto = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
    const cargo = (emp.cargo || emp.rol || "").toLowerCase();
    return nombreCompleto.includes(texto) || cargo.includes(texto);
  });
  renderizarTarjetas(filtrados);
}
async function cargarRoles() {
  const selectRol = document.getElementById("usuarioRol");
  if (!selectRol) return;
  selectRol.innerHTML = `<option value="" disabled selected>Cargando roles...</option>`;
  selectRol.disabled = true;

  try {
    const respuesta = await window.API.Roles.listar();
    const roles = Array.isArray(respuesta)
      ? respuesta
      : (respuesta?.data ?? []);

    if (!roles.length) {
      selectRol.innerHTML = `<option value="" disabled selected>No hay roles disponibles</option>`;
      return;
    }

    selectRol.innerHTML = `<option value="" disabled selected>Selecciona un rol</option>`;
    roles.forEach((rol) => {
      const opt = document.createElement("option");
      opt.value = rol.id ?? rol.rol_id;
      opt.textContent = rol.nombre ?? rol.name ?? `Rol #${opt.value}`;
      selectRol.appendChild(opt);
    });

    selectRol.disabled = false;
  } catch (error) {
    console.error("Error al cargar roles:", error);
    selectRol.innerHTML = `<option value="" disabled selected>Error al cargar roles</option>`;
    window.showError(
      "Error",
      "No se pudieron cargar los roles. Intenta de nuevo.",
    );
  }
}

async function cargarCargos() {
  const selectCargo = document.getElementById("empleadoCargo");
  if (!selectCargo) return;

  selectCargo.innerHTML = `<option value="" disabled selected>Cargando cargos...</option>`;
  selectCargo.disabled = true;

  try {
    const respuesta = await window.API.Cargos.listar();
    const cargos = Array.isArray(respuesta)
      ? respuesta
      : (respuesta?.data ?? []);

    if (!cargos.length) {
      selectCargo.innerHTML = `<option value="" disabled selected>No hay cargos disponibles</option>`;
      return;
    }

    selectCargo.innerHTML = `<option value="" disabled selected>Selecciona un cargo</option>`;
    cargos.forEach((cargo) => {
      const opt = document.createElement("option");
      opt.value = cargo.id ?? cargo.cargo_id;
      opt.textContent = cargo.nombre ?? cargo.name ?? `Cargo #${opt.value}`;
      selectCargo.appendChild(opt);
    });
    selectCargo.disabled = false;
  } catch (error) {
    console.error("Error al cargar cargos:", error);
    selectCargo.innerHTML = `<option value="" disabled selected>Error al cargar cargos</option>`;
    window.showError(
      "Error",
      "No se pudieron cargar los cargos. Intenta de nuevo.",
    );
  }
}

function mensajeDeError(error) {
  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    "Error desconocido"
  );
}

function setupModalEvents() {
  const modal = document.getElementById("modalAddEmployee");
  const btnOpen = document.getElementById("btnOpenModal");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel1 = document.getElementById("btnCancel1");

  btnOpen.onclick = () => {
    resetModalForm();
    modal.style.display = "flex";
    cargarRoles();
    cargarCargos();
  };

  const closeModal = () => {
    modal.style.display = "none";
  };
  btnClose.onclick = closeModal;
  btnCancel1.onclick = closeModal;
  document.getElementById("formStep1").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnNext = document.getElementById("btnSubmitStep1");
    btnNext.disabled = true;

    const loader = window.showLoader("Creando cuenta de usuario...");

    const payloadUsuario = {
      correo: document.getElementById("usuarioCorreo").value.trim(),
      password: document.getElementById("usuarioPassword").value,
      id_rol: document.getElementById("usuarioRol").value,
    };

    try {
      const respuesta = await window.API.Usuarios.crear(payloadUsuario);
      const usuario = respuesta?.data ?? respuesta;
      usuarioIdCreado = usuario?.id ?? usuario?.usuario_id ?? null;

      if (!usuarioIdCreado) {
        throw new Error(
          "El servidor no devolvió un ID de usuario. Revisa la respuesta del backend.",
        );
      }

      window.hideLoader();
      window.showSuccess(
        "Usuario creado",
        "Ahora completa los datos del empleado.",
      );

      document.getElementById("formStep1").classList.remove("active");
      document.getElementById("formStep2").classList.add("active");
      document.getElementById("stepIndicator1").classList.remove("active");
      document.getElementById("stepIndicator2").classList.add("active");
    } catch (error) {
      window.hideLoader();
      console.error("Error al crear usuario:", error);
      window.showError("Error al crear usuario", mensajeDeError(error));
    } finally {
      btnNext.disabled = false;
    }
  });

  document.getElementById("formStep2").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById("btnSubmitStep2");
    btnSave.disabled = true;

    if (!usuarioIdCreado) {
      window.showError(
        "Error interno",
        "No se encontró el ID del usuario. Reinicia el proceso.",
      );
      btnSave.disabled = false;
      return;
    }

    const loader = window.showLoader("Registrando empleado...", true);
    loader.setProgress(40);

    const payloadEmpleado = {
      id_usuario: usuarioIdCreado,
      id_cargo: document.getElementById("empleadoCargo").value,
      codigo_empleado: document.getElementById("empleadoCodigo").value.trim(),
      cedula: document.getElementById("empleadoCedula").value.trim(),
      nombres: document.getElementById("empleadoNombres").value.trim(),
      apellidos: document.getElementById("empleadoApellidos").value.trim(),
      telefono:
        document.getElementById("empleadoTelefono").value.trim() || null,
      direccion:
        document.getElementById("empleadoDireccion").value.trim() || null,
      fecha_contratacion: document.getElementById("empleadoFechaContratacion")
        .value,
      salario_base: parseFloat(
        document.getElementById("empleadoSalarioBase").value,
      ),
      estado: document.getElementById("empleadoEstado").value,
    };

    try {
      loader.setProgress(70);
      await window.API.Empleados.crear(payloadEmpleado);
      loader.setProgress(100);
      window.hideLoader();

      window.showSuccess(
        "Empleado registrado",
        `${payloadEmpleado.nombres} ${payloadEmpleado.apellidos} fue agregado correctamente.`,
      );

      closeModal();
      await cargarEmpleados();
    } catch (error) {
      window.hideLoader();
      console.error("Error al registrar empleado:", error);
      window.showError("Error al registrar empleado", mensajeDeError(error));
    } finally {
      btnSave.disabled = false;
    }
  });
}

function resetModalForm() {
  usuarioIdCreado = null;
  document.getElementById("formStep1").reset();
  document.getElementById("formStep2").reset();
  document.getElementById("formStep1").classList.add("active");
  document.getElementById("formStep2").classList.remove("active");
  document.getElementById("stepIndicator1").classList.add("active");
  document.getElementById("stepIndicator2").classList.remove("active");
}
