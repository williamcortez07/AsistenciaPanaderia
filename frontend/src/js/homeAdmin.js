document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  cargarInfoUsuario();
  iniciarCountdownQR();
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

let _qrTimer = null;

function abrirModalQR() {
  const modal = document.getElementById("modalQR");
  if (!modal) return;
  modal.style.display = "flex";
  iniciarCountdownQR();
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

function iniciarCountdownQR() {
  const spanSegundos = document.getElementById("segundos");
  if (!spanSegundos) return;

  let segundos = 30;
  spanSegundos.textContent = segundos;

  if (_qrTimer) clearInterval(_qrTimer);

  _qrTimer = setInterval(() => {
    segundos--;
    spanSegundos.textContent = segundos;
    if (segundos <= 0) {
      segundos = 30;
    }
  }, 1000);
}

window.abrirModalQR = abrirModalQR;
window.cerrarModalQR = cerrarModalQR;
