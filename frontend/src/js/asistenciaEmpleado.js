/* asistenciaEmpleado.js
 * Vista del Empleado: escanea QR generado por Admin,
 * valida el token y llama a check-in o check-out.
 */

const QR_TTL_MS = 60_000; // El QR es válido 60 segundos
let videoStream = null;
let scanLoop = null;
let yaEscaneado = false;

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();

  // Cargar info del empleado logueado desde localStorage
  await cargarInfoEmpleado();

  // Botones de cámara
  document.getElementById("btnStartScan").addEventListener("click", iniciarCamara);
  document.getElementById("btnStopScan").addEventListener("click", detenerCamara);

  // Input manual (fallback)
  document.getElementById("btnManualSubmit").addEventListener("click", () => {
    const raw = document.getElementById("manualQrCode").value.trim();
    if (!raw) return;
    procesarPayloadQR(raw);
  });

  document.getElementById("manualQrCode").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("btnManualSubmit").click();
    }
  });
});

/* ─── Cargar Info del Empleado desde localStorage ─── */
async function cargarInfoEmpleado() {
  try {
    const raw = localStorage.getItem("userInfo");
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      document.getElementById("empNombre").textContent = "No identificado";
      return;
    }

    const nombre = user.nombre || user.nombres || user.name || user.correo || "Empleado";
    document.getElementById("empNombre").textContent = nombre;

    const iniciales = nombre
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0] || "")
      .join("")
      .toUpperCase();
    document.getElementById("empAvatar").textContent = iniciales;

    // Si el user tiene id_empleado asociado, consultar su estado de hoy
    const idEmpleado = user.id_empleado ?? user.empleado_id;
    if (idEmpleado) {
      await verificarEstadoHoy(idEmpleado);
    } else {
      document.getElementById("empCargo").textContent = user.correo ?? "—";
      actualizarStatusPill("neutral", "🔍 Sin empleado vinculado");
    }
  } catch (e) {
    console.warn("Error al cargar info empleado:", e);
  }
}

async function verificarEstadoHoy(idEmpleado) {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const res = await window.API.Asistencia.listar({
      id_empleado: idEmpleado,
      fecha_desde: hoy,
      fecha_hasta: hoy,
    });
    const registros = Array.isArray(res) ? res : (res?.data ?? []);
    const registro = registros[0] ?? null;

    if (!registro) {
      actualizarStatusPill("entrada", "📋 Sin entrada registrada hoy");
    } else if (registro.hora_entrada && !registro.hora_salida) {
      actualizarStatusPill("salida", `✅ Entrada: ${registro.hora_entrada.slice(0, 5)} — Escanea para Salida`);
    } else if (registro.hora_entrada && registro.hora_salida) {
      actualizarStatusPill("completo", `✔ Asistencia completa (${registro.hora_entrada.slice(0, 5)} – ${registro.hora_salida.slice(0, 5)})`);
    }
  } catch (e) {
    console.warn("No se pudo verificar estado de hoy:", e);
  }
}

function actualizarStatusPill(tipo, texto) {
  const pill = document.getElementById("estadoHoy");
  pill.className = `status-pill ${tipo}`;
  pill.textContent = texto;
}

/* ─── Cámara y Escaneo QR ─── */
async function iniciarCamara() {
  if (videoStream) return;
  yaEscaneado = false;

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 } },
    });

    const video = document.getElementById("qrVideo");
    video.srcObject = videoStream;
    await video.play();

    document.getElementById("cameraStatus").classList.add("hidden");
    document.getElementById("btnStartScan").style.display = "none";
    document.getElementById("btnStopScan").style.display = "flex";
    document.getElementById("scanLine").style.display = "block";

    iniciarBucleDeEscaneo();
    lucide.createIcons();
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
    window.showError("Cámara no disponible", "No se pudo acceder a la cámara. Usa el modo manual.");
  }
}

function iniciarBucleDeEscaneo() {
  const video = document.getElementById("qrVideo");
  const canvas = document.getElementById("qrCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  function tick() {
    if (!videoStream || yaEscaneado) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR?.(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        yaEscaneado = true;
        detenerCamara();
        procesarPayloadQR(code.data);
        return;
      }
    }

    scanLoop = requestAnimationFrame(tick);
  }

  scanLoop = requestAnimationFrame(tick);
}

function detenerCamara() {
  if (videoStream) {
    videoStream.getTracks().forEach((t) => t.stop());
    videoStream = null;
  }
  if (scanLoop) {
    cancelAnimationFrame(scanLoop);
    scanLoop = null;
  }

  document.getElementById("cameraStatus").classList.remove("hidden");
  document.getElementById("btnStartScan").style.display = "flex";
  document.getElementById("btnStopScan").style.display = "none";
  document.getElementById("scanLine").style.display = "none";
  lucide.createIcons();
}

/* ─── Procesar el payload extraído del QR ─── */
async function procesarPayloadQR(rawData) {
  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch {
    mostrarResultado("error", "QR Inválido", "El código escaneado no es un QR de asistencia válido.");
    return;
  }

  // Validar estructura mínima
  if (payload.type !== "asistencia-panaderia" || !payload.exp) {
    mostrarResultado("error", "QR no reconocido", "Este código QR no pertenece al sistema de asistencia.");
    return;
  }

  // Validar expiración
  if (Date.now() > payload.exp) {
    mostrarResultado("error", "Código Expirado", `El QR expiró. Solicita un nuevo código al administrador.`);
    return;
  }

  // Obtener id_empleado del user logueado
  const raw = localStorage.getItem("userInfo");
  const user = raw ? JSON.parse(raw) : null;
  const id_empleado = user?.id_empleado ?? user?.empleado_id;

  if (!id_empleado) {
    mostrarResultado("error", "Sin empleado vinculado", "Tu cuenta de usuario no tiene un empleado asociado. Contacta al administrador.");
    return;
  }

  // Determinar si es check-in o check-out verificando estado actual
  const loader = window.showLoader?.("Registrando asistencia...");
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const resHoy = await window.API.Asistencia.listar({
      id_empleado,
      fecha_desde: hoy,
      fecha_hasta: hoy,
    });

    const registros = Array.isArray(resHoy) ? resHoy : (resHoy?.data ?? []);
    const registroHoy = registros[0] ?? null;

    let accion;
    let resultado;

    if (!registroHoy) {
      // No hay registro → CHECK-IN
      accion = "check-in";
      resultado = await window.API.Asistencia.checkIn({ id_empleado });

      const horaEntrada = resultado?.data?.hora_entrada ?? resultado?.hora_entrada ?? "—";
      const estado = resultado?.data?.estado ?? resultado?.estado ?? "presente";
      const esTardanza = estado === "tardanza";

      mostrarResultado(
        "success",
        esTardanza ? "⚠ Entrada Tardía" : "✅ Entrada Registrada",
        `Tu entrada fue marcada a las ${horaEntrada.slice(0, 5)}${esTardanza ? " (tardanza)" : ""}`
      );
      actualizarStatusPill("salida", `✅ Entrada: ${horaEntrada.slice(0, 5)} — Escanea para Salida`);

    } else if (registroHoy.hora_entrada && !registroHoy.hora_salida) {
      // Hay entrada pero no salida → CHECK-OUT
      accion = "check-out";
      resultado = await window.API.Asistencia.checkOut({ id_empleado });

      const horaSalida = resultado?.data?.hora_salida ?? resultado?.hora_salida ?? "—";
      mostrarResultado(
        "success",
        "✅ Salida Registrada",
        `Tu salida fue marcada a las ${horaSalida.slice(0, 5)}. ¡Hasta mañana!`
      );
      actualizarStatusPill("completo", `✔ Asistencia completa (${registroHoy.hora_entrada.slice(0, 5)} – ${horaSalida.slice(0, 5)})`);

    } else {
      // Ya tiene entrada y salida → Asistencia completa
      mostrarResultado(
        "error",
        "Asistencia ya completa",
        `Ya tienes entrada (${registroHoy.hora_entrada.slice(0, 5)}) y salida (${registroHoy.hora_salida.slice(0, 5)}) para hoy.`
      );
    }

    window.hideLoader?.();

  } catch (err) {
    window.hideLoader?.();
    console.error("Error al registrar asistencia:", err);
    const msg = err?.data?.message || err?.message || "No se pudo registrar la asistencia.";
    mostrarResultado("error", "Error al marcar", msg);
  }
}

/* ─── Mostrar Resultado Visual ─── */
function mostrarResultado(tipo, titulo, mensaje) {
  const box = document.getElementById("scanResult");
  const icon = document.getElementById("resultIcon");
  const title = document.getElementById("resultTitle");
  const msg = document.getElementById("resultMessage");

  box.style.display = "flex";
  box.className = `scan-result ${tipo === "error" ? "error" : ""}`;
  title.textContent = titulo;
  msg.textContent = mensaje;
  icon.innerHTML = tipo === "error"
    ? `<i data-lucide="x-circle" style="width:32px;height:32px;"></i>`
    : `<i data-lucide="check-circle" style="width:32px;height:32px;"></i>`;

  lucide.createIcons();

  // Ocultar resultado después de 8 segundos
  setTimeout(() => {
    box.style.display = "none";
    yaEscaneado = false;
  }, 8000);
}
