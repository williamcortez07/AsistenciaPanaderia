/**
 * Módulo Frontend: Evaluación de Desempeño
 * Maneja la interacción de UI, carga de datos dinámica, modales y cálculo de rúbricas.
 */

document.addEventListener("DOMContentLoaded", () => {
  initUserInfo();
  initDropdowns();
  switchTab("evaluaciones");
});

// Estado global de la vista
const state = {
  currentTab: "evaluaciones",
  periodos: [],
  criteriosBase: [],
  empleados: [],
  usuarios: [],
  evaluacionEnCalificacion: null,
  periodoEnConfiguracion: null,
};

function initUserInfo() {
  const userInfoStr = localStorage.getItem("userInfo");
  if (userInfoStr) {
    try {
      const u = JSON.parse(userInfoStr);
      const nameEl = document.getElementById("headerUserName");
      if (nameEl && u.nombre) {
        nameEl.textContent = u.nombre;
      }
    } catch (e) {
      console.warn("Error parsing userInfo", e);
    }
  }
}

async function initDropdowns() {
  try {
    const [empRes, userRes, perRes, critRes] = await Promise.allSettled([
      window.API?.Empleados?.listar({ limit: 100 }),
      window.API?.Usuarios?.listar({ limit: 100 }),
      window.API?.Evaluaciones?.listarPeriodos({ limit: 100 }),
      window.API?.Evaluaciones?.listarCriterios({ activo: true }),
    ]);

    if (empRes.status === "fulfilled") {
      state.empleados = empRes.value?.data || empRes.value || [];
      populateEmpleadoSelects();
    }

    if (userRes.status === "fulfilled") {
      state.usuarios = userRes.value?.data || userRes.value || [];
      populateUsuarioSelects();
    }

    if (perRes.status === "fulfilled") {
      state.periodos = perRes.value?.data || perRes.value || [];
      populatePeriodoSelects();
    }

    if (critRes.status === "fulfilled") {
      state.criteriosBase = critRes.value?.data || critRes.value || [];
      populateCriteriosBaseSelects();
    }
  } catch (err) {
    console.error("Error cargando catálogos iniciales:", err);
  }
}

function populateEmpleadoSelects() {
  const selects = ["filtroObjEmpleado", "evalEmpleadoId", "objEmpleadoId"];
  selects.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const isFilter = id.startsWith("filtro");
    el.innerHTML = isFilter
      ? '<option value="">Todos los empleados</option>'
      : '<option value="" disabled selected>Seleccionar empleado...</option>';

    state.empleados.forEach((emp) => {
      const opt = document.createElement("option");
      opt.value = emp.id;
      opt.textContent = `${emp.codigo_empleado ? emp.codigo_empleado + " - " : ""}${emp.nombres} ${emp.apellidos}`;
      el.appendChild(opt);
    });
  });
}

function populatePeriodoSelects() {
  const selects = ["filtroEvalPeriodo", "evalPeriodoId", "objPeriodoId"];
  selects.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const isFilter = id.startsWith("filtro");
    el.innerHTML = isFilter
      ? '<option value="">Todos los periodos</option>'
      : '<option value="" disabled selected>Seleccionar periodo...</option>';

    state.periodos.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.nombre} (${p.duracion_meses} meses) [${p.estado}]`;
      el.appendChild(opt);
    });
  });
}

function populateUsuarioSelects() {
  const el = document.getElementById("evalEvaluadorId");
  if (!el) return;

  el.innerHTML = '<option value="">Sin evaluador asignado (Opcional)</option>';
  state.usuarios.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.nombre} (${u.email})`;
    el.appendChild(opt);
  });
}

function populateCriteriosBaseSelects() {
  const el = document.getElementById("configCriterioId");
  if (!el) return;

  el.innerHTML =
    '<option value="" disabled selected>Seleccionar criterio base...</option>';
  state.criteriosBase.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.orden}. ${c.nombre}`;
    el.appendChild(opt);
  });
}

// ==========================================
// TABS NAVIGATION
// ==========================================

function switchTab(tabName) {
  state.currentTab = tabName;

  const tabs = ["evaluaciones", "periodos", "criterios", "objetivos"];
  tabs.forEach((t) => {
    const btn = document.getElementById(`tabBtn${capitalize(t)}`);
    const panel = document.getElementById(`panel${capitalize(t)}`);
    if (btn) btn.classList.toggle("active", t === tabName);
    if (panel) panel.style.display = t === tabName ? "block" : "none";
  });

  if (tabName === "evaluaciones") cargarEvaluaciones();
  if (tabName === "periodos") cargarPeriodos();
  if (tabName === "criterios") cargarCriterios();
  if (tabName === "objetivos") cargarObjetivos();

  refreshLucideIcons();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function refreshLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    setTimeout(() => window.lucide.createIcons(), 50);
  }
}

// ==========================================
// 1. CARGA DE EVALUACIONES DE EMPLEADOS
// ==========================================

async function cargarEvaluaciones() {
  const tbody = document.getElementById("tbodyEvaluaciones");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align:center; padding:2rem;">Cargando evaluaciones de desempeño...</td></tr>';

  try {
    const periodo = document.getElementById("filtroEvalPeriodo")?.value || null;
    const estado = document.getElementById("filtroEvalEstado")?.value || null;

    const params = { limit: 50 };
    if (periodo) params.id_periodo = periodo;
    if (estado) params.estado = estado;

    const res = await window.API.Evaluaciones.listarEvaluaciones(params);
    const lista = res?.data || res || [];

    if (lista.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--gris-neutro);">No se encontraron evaluaciones registradas.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((item) => {
      const tr = document.createElement("tr");

      const scoreNum = parseFloat(item.puntuacion_total || 0);
      let scoreClass = "deficiente";
      if (scoreNum >= 90) scoreClass = "excelente";
      else if (scoreNum >= 80) scoreClass = "bueno";
      else if (scoreNum >= 70) scoreClass = "regular";

      const scoreDisplay =
        item.puntuacion_total !== null && item.puntuacion_total !== undefined
          ? `<span class="score-pill ${scoreClass}">${scoreNum.toFixed(2)} pts</span>`
          : '<span style="color:#aaa; font-style:italic;">Sin calificar</span>';

      const fechaFmt = item.fecha_evaluacion
        ? new Date(item.fecha_evaluacion).toLocaleDateString("es-NI")
        : "--";

      tr.innerHTML = `
        <td><strong>${item.empleado_nombres || ""} ${item.empleado_apellidos || ""}</strong> <br><small style="color:#777;">${item.codigo_empleado || ""}</small></td>
        <td>${item.periodo_nombre || "Periodo N/A"}</td>
        <td>${item.evaluador_nombre || '<span style="color:#aaa;">Pendiente</span>'}</td>
        <td>${fechaFmt}</td>
        <td><span class="badge-status ${item.estado}">${item.estado}</span></td>
        <td>${scoreDisplay}</td>
        <td>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-primary" style="padding:0.35rem 0.6rem; font-size:0.78rem;" onclick="abrirModalCalificar('${item.id}')">
              <i data-lucide="edit-3"></i> Calificar Checklist
            </button>
            <button class="btn-secondary" style="padding:0.35rem 0.6rem; font-size:0.78rem;" onclick="cambiarEstadoEvaluacionPrompt('${item.id}', '${item.estado}')">
              Estado
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    refreshLucideIcons();
  } catch (err) {
    console.error("Error al cargar evaluaciones:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar evaluaciones: ${err.message}</td></tr>`;
  }
}

async function cambiarEstadoEvaluacionPrompt(id, estadoActual) {
  const nuevoEstado = prompt(
    `Cambiar estado de evaluación.\nEstados válidos: borrador, en_proceso, completada, aprobada, cancelada`,
    estadoActual
  );

  if (!nuevoEstado || nuevoEstado.trim() === estadoActual) return;

  const validos = ["borrador", "en_proceso", "completada", "aprobada", "cancelada"];
  if (!validos.includes(nuevoEstado.trim().toLowerCase())) {
    window.showError?.("Estado No Válido", "Seleccione un estado correcto");
    return;
  }

  try {
    await window.API.Evaluaciones.cambiarEstadoEvaluacion(id, {
      estado: nuevoEstado.trim().toLowerCase(),
    });
    window.showSuccess?.(
      "Estado Actualizado",
      `La evaluación cambió a '${nuevoEstado}'`
    );
    cargarEvaluaciones();
  } catch (err) {
    window.showError?.("Error", err.message || "No se pudo cambiar el estado");
  }
}

// ==========================================
// 2. CALIFICACIÓN EN BULK DE LA CHECKLIST
// ==========================================

async function abrirModalCalificar(idEvaluacion) {
  try {
    const res = await window.API.Evaluaciones.obtenerEvaluacion(idEvaluacion);
    const ev = res?.data || res;
    state.evaluacionEnCalificacion = ev;

    document.getElementById("califEmpleadoNombre").textContent =
      `Empleado: ${ev.empleado_nombres} ${ev.empleado_apellidos} (${ev.codigo_empleado || "N/A"})`;
    document.getElementById("califPeriodoNombre").textContent =
      `Periodo: ${ev.periodo_nombre} | Estado: ${ev.estado}`;
    document.getElementById("califObservaciones").value = ev.observaciones || "";

    // Obtener checklist de rubros del periodo
    const perRes = await window.API.Evaluaciones.listarCriteriosPeriodo(
      ev.id_periodo
    );
    const criteriosPeriodo =
      perRes?.data?.criterios || perRes?.criterios || [];

    const container = document.getElementById("containerChecklistItems");
    container.innerHTML = "";

    if (criteriosPeriodo.length === 0) {
      container.innerHTML =
        '<div style="background:#fff3bf; color:#8f5d00; padding:1.25rem; border-radius:10px; text-align:center;">El periodo de evaluación aún no posee criterios ni checklist configurada. Por favor, configura la checklist del periodo primero.</div>';
    } else {
      // Mapear respuestas existentes si las hay
      const respuestasMap = new Map();
      (ev.resultados_checklist || []).forEach((r) => {
        respuestasMap.set(r.id_criterio_periodo, r);
      });

      criteriosPeriodo.forEach((cp) => {
        const resPrev = respuestasMap.get(cp.id) || {};
        const scoreVal =
          resPrev.puntuacion !== undefined ? resPrev.puntuacion : cp.puntuacion_maxima;
        const comentarioVal = resPrev.comentario || "";
        const cumplidoVal =
          resPrev.cumplido !== undefined ? resPrev.cumplido : true;

        const itemDiv = document.createElement("div");
        itemDiv.className = "checklist-card-item";
        itemDiv.dataset.idCriterioPeriodo = cp.id;
        itemDiv.dataset.ponderacion = cp.ponderacion;
        itemDiv.dataset.maxScore = cp.puntuacion_maxima;

        itemDiv.innerHTML = `
          <div class="checklist-header">
            <div class="checklist-title">
              <i data-lucide="check-circle-2"></i> ${cp.criterio_nombre}
            </div>
            <div class="checklist-weights">
              Ponderación: <strong>${cp.ponderacion}%</strong> | Puntos Máx: <strong>${cp.puntuacion_maxima}</strong>
            </div>
          </div>
          ${cp.criterio_descripcion ? `<p style="font-size:0.85rem; color:var(--gris-neutro); margin-bottom:0.75rem;">${cp.criterio_descripcion}</p>` : ""}

          <div class="checklist-controls">
            <div class="modal-form-group">
              <label>Puntuación Otorgada (0 - ${cp.puntuacion_maxima})</label>
              <input type="number" class="input-score" value="${scoreVal}" min="0" max="${cp.puntuacion_maxima}" step="0.5" oninput="recalcularTotalChecklistLive()" required />
            </div>

            <div class="modal-form-group" style="align-items:flex-start;">
              <label>Cumplimiento Rúbrica</label>
              <label style="display:flex; align-items:center; gap:0.5rem; font-weight:normal; cursor:pointer; margin-top:0.4rem;">
                <input type="checkbox" class="input-cumplido" ${cumplidoVal ? "checked" : ""} style="width:18px; height:18px;" />
                Criterio Cumplido
              </label>
            </div>

            <div class="modal-form-group">
              <label>Comentario / Evidencia</label>
              <input type="text" class="input-comentario" value="${comentarioVal}" placeholder="Ej: Demuestra alto desempeño..." />
            </div>
          </div>
        `;
        container.appendChild(itemDiv);
      });
    }

    recalcularTotalChecklistLive();
    document.getElementById("modalCalificarChecklist").style.display = "flex";
    refreshLucideIcons();
  } catch (err) {
    console.error("Error al abrir modal calificar:", err);
    window.showError?.(
      "Error",
      err.message || "No se pudo cargar la evaluación"
    );
  }
}

function recalcularTotalChecklistLive() {
  const items = document.querySelectorAll(".checklist-card-item");
  let totalCalculado = 0;

  items.forEach((div) => {
    const ponderacion = parseFloat(div.dataset.ponderacion || 0);
    const maxScore = parseFloat(div.dataset.maxScore || 100);
    const inputScore = div.querySelector(".input-score");

    const score = parseFloat(inputScore?.value || 0);
    if (maxScore > 0) {
      totalCalculado += (score / maxScore) * ponderacion;
    }
  });

  const totalEl = document.getElementById("califScoreTotal");
  if (totalEl) {
    totalEl.textContent = `${totalCalculado.toFixed(2)} pts`;
    totalEl.className = "score-pill";
    if (totalCalculado >= 90) totalEl.classList.add("excelente");
    else if (totalCalculado >= 80) totalEl.classList.add("bueno");
    else if (totalCalculado >= 70) totalEl.classList.add("regular");
    else totalEl.classList.add("deficiente");
  }
}

function cerrarModalCalificar() {
  document.getElementById("modalCalificarChecklist").style.display = "none";
  state.evaluacionEnCalificacion = null;
}

document
  .getElementById("formCalificarChecklist")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.evaluacionEnCalificacion) return;

    const idEval = state.evaluacionEnCalificacion.id;
    const items = document.querySelectorAll(".checklist-card-item");

    const resultadosPayload = [];
    items.forEach((div) => {
      const idCriterioPeriodo = div.dataset.idCriterioPeriodo;
      const puntuacion = parseFloat(
        div.querySelector(".input-score")?.value || 0
      );
      const cumplido = div.querySelector(".input-cumplido")?.checked || false;
      const comentario = div.querySelector(".input-comentario")?.value || "";

      resultadosPayload.push({
        id_criterio_periodo: idCriterioPeriodo,
        puntuacion,
        cumplido,
        comentario,
      });
    });

    const observaciones = document.getElementById("califObservaciones")?.value;

    try {
      if (observaciones !== undefined) {
        await window.API.Evaluaciones.actualizarEvaluacion(idEval, {
          observaciones,
        });
      }

      if (resultadosPayload.length > 0) {
        await window.API.Evaluaciones.guardarResultadosBulk(idEval, {
          resultados: resultadosPayload,
        });
      }

      window.showSuccess?.(
        "Evaluación Guardada",
        "Resultados y nota total actualizados exitosamente"
      );
      cerrarModalCalificar();
      cargarEvaluaciones();
    } catch (err) {
      console.error("Error al guardar calificaciones:", err);
      window.showError?.(
        "Error al Guardar",
        err.message || "Ocurrió un error al procesar el envío"
      );
    }
  });

// ==========================================
// 3. PERIODOS DE EVALUACIÓN (6 MESES)
// ==========================================

async function cargarPeriodos() {
  const tbody = document.getElementById("tbodyPeriodos");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align:center; padding:2rem;">Cargando periodos de evaluación...</td></tr>';

  try {
    const estado = document.getElementById("filtroPeriodoEstado")?.value || null;
    const params = { limit: 50 };
    if (estado) params.estado = estado;

    const res = await window.API.Evaluaciones.listarPeriodos(params);
    const lista = res?.data || res || [];

    state.periodos = lista; // actualizar cache
    populatePeriodoSelects();

    if (lista.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--gris-neutro);">No hay periodos de evaluación creados.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((p) => {
      const tr = document.createElement("tr");

      const fInicio = p.fecha_inicio
        ? new Date(p.fecha_inicio).toLocaleDateString("es-NI")
        : "--";
      const fFin = p.fecha_fin
        ? new Date(p.fecha_fin).toLocaleDateString("es-NI")
        : "--";

      tr.innerHTML = `
        <td><strong>${p.nombre}</strong></td>
        <td>${fInicio}</td>
        <td>${fFin}</td>
        <td><span class="badge-role">${p.duracion_meses} Meses</span></td>
        <td><span id="pctPeriodoBadge_${p.id}" class="badge-status abierto">Consultando...</span></td>
        <td><span class="badge-status ${p.estado}">${p.estado}</span></td>
        <td>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-primary" style="padding:0.35rem 0.6rem; font-size:0.78rem;" onclick="abrirModalConfigPeriodo('${p.id}')">
              <i data-lucide="settings"></i> Checklist / Ponderación
            </button>
            <button class="btn-secondary" style="padding:0.35rem 0.6rem; font-size:0.78rem;" onclick="cambiarEstadoPeriodoPrompt('${p.id}', '${p.estado}')">
              Estado
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      // Cargar suma de ponderación asíncrona por fila
      window.API.Evaluaciones.listarCriteriosPeriodo(p.id)
        .then((cpRes) => {
          const totalPct = cpRes?.data?.total_ponderacion ?? cpRes?.total_ponderacion ?? 0;
          const badgeEl = document.getElementById(`pctPeriodoBadge_${p.id}`);
          if (badgeEl) {
            badgeEl.textContent = `${totalPct}% Ponderado`;
            if (totalPct === 100) {
              badgeEl.className = "badge-status abierto";
            } else {
              badgeEl.className = "badge-status borrador";
            }
          }
        })
        .catch(() => {});
    });

    refreshLucideIcons();
  } catch (err) {
    console.error("Error cargando periodos:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
  }
}

async function cambiarEstadoPeriodoPrompt(id, estadoActual) {
  const nuevoEstado = prompt(
    `Cambiar estado del periodo.\nEstados válidos: abierto, cerrado, cancelado`,
    estadoActual
  );

  if (!nuevoEstado || nuevoEstado.trim() === estadoActual) return;

  const validos = ["abierto", "cerrado", "cancelado"];
  if (!validos.includes(nuevoEstado.trim().toLowerCase())) {
    window.showError?.("Estado No Válido", "Seleccione abierto, cerrado o cancelado");
    return;
  }

  try {
    await window.API.Evaluaciones.cambiarEstadoPeriodo(id, {
      estado: nuevoEstado.trim().toLowerCase(),
    });
    window.showSuccess?.("Periodo Actualizado", `El periodo cambió a '${nuevoEstado}'`);
    cargarPeriodos();
  } catch (err) {
    window.showError?.("Error", err.message);
  }
}

function abrirModalCrearPeriodo() {
  document.getElementById("periodoId").value = "";
  document.getElementById("periodoNombre").value = "";
  
  // Rellenar fechas semestrales sugeridas
  const hoy = new Date();
  const en6Meses = new Date();
  en6Meses.setMonth(hoy.getMonth() + 6);

  document.getElementById("periodoFechaInicio").value = hoy.toISOString().split("T")[0];
  document.getElementById("periodoFechaFin").value = en6Meses.toISOString().split("T")[0];
  document.getElementById("periodoDuracion").value = 6;
  document.getElementById("periodoEstado").value = "abierto";

  document.getElementById("modalPeriodoTitle").textContent = "Nuevo Periodo de Evaluación (6 Meses)";
  document.getElementById("modalPeriodo").style.display = "flex";
}

function cerrarModalPeriodo() {
  document.getElementById("modalPeriodo").style.display = "none";
}

document.getElementById("formPeriodo")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById("periodoNombre").value,
    fecha_inicio: document.getElementById("periodoFechaInicio").value,
    fecha_fin: document.getElementById("periodoFechaFin").value,
    duracion_meses: parseInt(document.getElementById("periodoDuracion").value, 10) || 6,
    estado: document.getElementById("periodoEstado").value,
  };

  try {
    await window.API.Evaluaciones.crearPeriodo(payload);
    window.showSuccess?.("Periodo Creado", "Periodo de evaluación semestral configurado con éxito");
    cerrarModalPeriodo();
    cargarPeriodos();
  } catch (err) {
    window.showError?.("Error al Crear Periodo", err.message);
  }
});

// ==========================================
// 4. CONFIGURACIÓN DE CHECKLIST DE PERIODO
// ==========================================

async function abrirModalConfigPeriodo(idPeriodo) {
  state.periodoEnConfiguracion = idPeriodo;
  const p = state.periodos.find((x) => x.id === idPeriodo);

  document.getElementById("configPeriodoNombreTitle").textContent =
    p ? `Periodo: ${p.nombre}` : `Periodo ID: ${idPeriodo}`;

  await renderTablaConfigPeriodo(idPeriodo);
  document.getElementById("modalConfigPeriodo").style.display = "flex";
  refreshLucideIcons();
}

async function renderTablaConfigPeriodo(idPeriodo) {
  const tbody = document.getElementById("tbodyConfigPeriodo");
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando criterios del periodo...</td></tr>';

  try {
    const res = await window.API.Evaluaciones.listarCriteriosPeriodo(idPeriodo);
    const data = res?.data || res || {};
    const criterios = data.criterios || [];
    const totalPonderado = data.total_ponderacion || 0;

    const totalBadge = document.getElementById("configPeriodoTotalPct");
    if (totalBadge) {
      totalBadge.textContent = `${totalPonderado}% Suma Ponderada`;
      totalBadge.className = totalPonderado === 100 ? "badge-status abierto" : "badge-status borrador";
    }

    if (criterios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#888;">No hay criterios asignados a este periodo. Agrega uno usando el formulario superior.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    criterios.forEach((cp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${cp.criterio_nombre}</strong><br><small style="color:#666;">${cp.criterio_descripcion || ""}</small></td>
        <td><strong style="color:var(--marron-calido);">${cp.ponderacion}%</strong></td>
        <td>${cp.puntuacion_maxima} pts</td>
        <td>
          <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:red; border-color:red;" onclick="eliminarCriterioPeriodo('${cp.id}')">
            Quitar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al renderizar config de periodo:", err);
    tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
  }
}

function cerrarModalConfigPeriodo() {
  document.getElementById("modalConfigPeriodo").style.display = "none";
  state.periodoEnConfiguracion = null;
  cargarPeriodos();
}

document.getElementById("formAddCriterioPeriodo")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.periodoEnConfiguracion) return;

  const payload = {
    id_criterio: document.getElementById("configCriterioId").value,
    ponderacion: parseFloat(document.getElementById("configPonderacion").value),
    puntuacion_maxima: parseFloat(document.getElementById("configMaxScore").value) || 100,
    orden: 1,
  };

  try {
    const res = await window.API.Evaluaciones.agregarCriterioPeriodo(
      state.periodoEnConfiguracion,
      payload
    );

    if (res?.advertencia_ponderacion) {
      window.showWarning?.("Criterio Asignado", res.advertencia_ponderacion);
    } else {
      window.showSuccess?.("Criterio Asignado", "Criterio agregado exitosamente a la checklist");
    }

    document.getElementById("configPonderacion").value = "";
    renderTablaConfigPeriodo(state.periodoEnConfiguracion);
  } catch (err) {
    window.showError?.("Error al Asignar", err.message);
  }
});

async function eliminarCriterioPeriodo(idCriterioPeriodo) {
  if (!confirm("¿Desea remover este criterio de la checklist del periodo?")) return;
  try {
    await window.API.Evaluaciones.eliminarCriterioPeriodo(
      state.periodoEnConfiguracion,
      idCriterioPeriodo
    );
    window.showSuccess?.("Removido", "Criterio quitado de la checklist del periodo");
    renderTablaConfigPeriodo(state.periodoEnConfiguracion);
  } catch (err) {
    window.showError?.("Error al Quitar", err.message);
  }
}

// ==========================================
// 5. CATÁLOGO DE CRITERIOS (CHECKLIST BASE)
// ==========================================

async function cargarCriterios() {
  const tbody = document.getElementById("tbodyCriterios");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Cargando catálogo de criterios...</td></tr>';

  try {
    const activoVal = document.getElementById("filtroCriterioActivo")?.value;
    const params = {};
    if (activoVal !== "") params.activo = activoVal;

    const res = await window.API.Evaluaciones.listarCriterios(params);
    const lista = res?.data || res || [];

    state.criteriosBase = lista;
    populateCriteriosBaseSelects();

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--gris-neutro);">No hay criterios base registrados en el catálogo.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="badge-role">#${c.orden}</span></td>
        <td><strong>${c.nombre}</strong></td>
        <td>${c.descripcion || '<span style="color:#aaa;">Sin descripción</span>'}</td>
        <td><span class="badge-status ${c.activo ? "abierto" : "cerrado"}">${c.activo ? "Activo" : "Inactivo"}</span></td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editarCriterioPrompt('${c.id}', '${c.nombre}', '${c.descripcion || ""}', ${c.orden}, ${c.activo})">
              Editar
            </button>
            <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:red; border-color:red;" onclick="eliminarCriterioBase('${c.id}')">
              Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    refreshLucideIcons();
  } catch (err) {
    console.error("Error al cargar criterios:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
  }
}

function abrirModalCrearCriterio() {
  document.getElementById("criterioId").value = "";
  document.getElementById("criterioNombre").value = "";
  document.getElementById("criterioDescripcion").value = "";
  document.getElementById("criterioOrden").value = (state.criteriosBase.length + 1);
  document.getElementById("criterioActivo").value = "true";

  document.getElementById("modalCriterioTitle").textContent = "Nuevo Criterio de Evaluación Base";
  document.getElementById("modalCriterio").style.display = "flex";
}

function cerrarModalCriterio() {
  document.getElementById("modalCriterio").style.display = "none";
}

document.getElementById("formCriterio")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("criterioId").value;
  const payload = {
    nombre: document.getElementById("criterioNombre").value,
    descripcion: document.getElementById("criterioDescripcion").value,
    orden: parseInt(document.getElementById("criterioOrden").value, 10) || 1,
    activo: document.getElementById("criterioActivo").value === "true",
  };

  try {
    if (id) {
      await window.API.Evaluaciones.actualizarCriterio(id, payload);
      window.showSuccess?.("Actualizado", "Criterio actualizado con éxito");
    } else {
      await window.API.Evaluaciones.crearCriterio(payload);
      window.showSuccess?.("Creado", "Nuevo criterio registrado en el catálogo");
    }
    cerrarModalCriterio();
    cargarCriterios();
  } catch (err) {
    window.showError?.("Error", err.message);
  }
});

function editarCriterioPrompt(id, nombre, descripcion, orden, activo) {
  document.getElementById("criterioId").value = id;
  document.getElementById("criterioNombre").value = nombre;
  document.getElementById("criterioDescripcion").value = descripcion;
  document.getElementById("criterioOrden").value = orden;
  document.getElementById("criterioActivo").value = activo ? "true" : "false";

  document.getElementById("modalCriterioTitle").textContent = "Editar Criterio del Catálogo";
  document.getElementById("modalCriterio").style.display = "flex";
}

async function eliminarCriterioBase(id) {
  if (!confirm("¿Está seguro de eliminar este criterio base?")) return;
  try {
    await window.API.Evaluaciones.eliminarCriterio(id);
    window.showSuccess?.("Eliminado", "Criterio eliminado del catálogo");
    cargarCriterios();
  } catch (err) {
    window.showError?.("Error", err.message);
  }
}

// ==========================================
// 6. INICIAR EVALUACIÓN DE EMPLEADO
// ==========================================

function abrirModalCrearEvaluacion() {
  document.getElementById("evalEmpleadoId").value = "";
  document.getElementById("evalPeriodoId").value = "";
  document.getElementById("evalEvaluadorId").value = "";
  document.getElementById("evalObservacionesIniciales").value = "";

  document.getElementById("modalCrearEvaluacion").style.display = "flex";
}

function cerrarModalCrearEvaluacion() {
  document.getElementById("modalCrearEvaluacion").style.display = "none";
}

document.getElementById("formCrearEvaluacion")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    id_empleado: document.getElementById("evalEmpleadoId").value,
    id_periodo: document.getElementById("evalPeriodoId").value,
    id_evaluador: document.getElementById("evalEvaluadorId").value || null,
    observaciones: document.getElementById("evalObservacionesIniciales").value || null,
  };

  try {
    const res = await window.API.Evaluaciones.crearEvaluacion(payload);
    window.showSuccess?.("Evaluación Iniciada", "Se ha creado la evaluación de desempeño para el empleado");
    cerrarModalCrearEvaluacion();
    cargarEvaluaciones();

    // Abrir inmediatamente la checklist para calificar
    if (res?.data?.id) {
      abrirModalCalificar(res.data.id);
    }
  } catch (err) {
    window.showError?.("Error al Crear", err.message);
  }
});

// ==========================================
// 7. OBJETIVOS DE EMPLEADOS
// ==========================================

async function cargarObjetivos() {
  const tbody = document.getElementById("tbodyObjetivos");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">Cargando objetivos de empleados...</td></tr>';

  try {
    const empId = document.getElementById("filtroObjEmpleado")?.value || null;
    const estVal = document.getElementById("filtroObjEstado")?.value || null;

    const params = {};
    if (empId) params.id_empleado = empId;
    if (estVal) params.estado = estVal;

    const res = await window.API.Evaluaciones.listarObjetivos(params);
    const lista = res?.data || res || [];

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--gris-neutro);">No se encontraron objetivos de empleados.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((obj) => {
      const tr = document.createElement("tr");

      const pctNum = parseFloat(obj.porcentaje_cumplimiento || 0);
      const metaStr = obj.meta ? `${obj.meta}` : "N/A";
      const resStr = obj.resultado ? `${obj.resultado}` : "0";

      tr.innerHTML = `
        <td><strong>${obj.empleado_nombres || ""} ${obj.empleado_apellidos || ""}</strong></td>
        <td>${obj.periodo_nombre || "Periodo N/A"}</td>
        <td><strong>${obj.titulo}</strong><br><small style="color:#666;">${obj.descripcion || ""}</small></td>
        <td>Meta: ${metaStr} | Logro: ${resStr}</td>
        <td>
          <div style="font-weight:700; font-size:0.85rem; margin-bottom:0.2rem;">${pctNum.toFixed(1)}%</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width:${Math.min(pctNum, 100)}%;"></div>
          </div>
        </td>
        <td><span class="badge-status ${obj.estado}">${obj.estado}</span></td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editarObjetivoPrompt('${obj.id}', '${obj.titulo}', '${obj.descripcion || ""}', '${obj.meta || ""}', '${obj.resultado || ""}', '${obj.estado}')">
              Editar
            </button>
            <button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:red; border-color:red;" onclick="eliminarObjetivo('${obj.id}')">
              Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    refreshLucideIcons();
  } catch (err) {
    console.error("Error al cargar objetivos:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
  }
}

function abrirModalCrearObjetivo() {
  document.getElementById("objId").value = "";
  document.getElementById("objEmpleadoId").value = "";
  document.getElementById("objPeriodoId").value = "";
  document.getElementById("objTitulo").value = "";
  document.getElementById("objDescripcion").value = "";
  document.getElementById("objMeta").value = "";
  document.getElementById("objResultado").value = "";
  document.getElementById("objEstado").value = "pendiente";

  document.getElementById("modalObjetivoTitle").textContent = "Asignar Nuevo Objetivo a Empleado";
  document.getElementById("modalObjetivo").style.display = "flex";
}

function cerrarModalObjetivo() {
  document.getElementById("modalObjetivo").style.display = "none";
}

document.getElementById("formObjetivo")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("objId").value;
  const payload = {
    id_empleado: document.getElementById("objEmpleadoId").value,
    id_periodo: document.getElementById("objPeriodoId").value,
    titulo: document.getElementById("objTitulo").value,
    descripcion: document.getElementById("objDescripcion").value || null,
    meta: parseFloat(document.getElementById("objMeta").value) || null,
    resultado: parseFloat(document.getElementById("objResultado").value) || null,
    estado: document.getElementById("objEstado").value,
  };

  try {
    if (id) {
      await window.API.Evaluaciones.actualizarObjetivo(id, payload);
      window.showSuccess?.("Actualizado", "Objetivo de empleado actualizado");
    } else {
      await window.API.Evaluaciones.crearObjetivo(payload);
      window.showSuccess?.("Objetivo Asignado", "Se ha asignado el nuevo objetivo");
    }
    cerrarModalObjetivo();
    cargarObjetivos();
  } catch (err) {
    window.showError?.("Error", err.message);
  }
});

function editarObjetivoPrompt(id, titulo, descripcion, meta, resultado, estado) {
  document.getElementById("objId").value = id;
  document.getElementById("objTitulo").value = titulo;
  document.getElementById("objDescripcion").value = descripcion;
  document.getElementById("objMeta").value = meta;
  document.getElementById("objResultado").value = resultado;
  document.getElementById("objEstado").value = estado;

  document.getElementById("modalObjetivoTitle").textContent = "Editar Objetivo de Empleado";
  document.getElementById("modalObjetivo").style.display = "flex";
}

async function eliminarObjetivo(id) {
  if (!confirm("¿Deseas eliminar este objetivo?")) return;
  try {
    await window.API.Evaluaciones.eliminarObjetivo(id);
    window.showSuccess?.("Eliminado", "Objetivo eliminado exitosamente");
    cargarObjetivos();
  } catch (err) {
    window.showError?.("Error", err.message);
  }
}
