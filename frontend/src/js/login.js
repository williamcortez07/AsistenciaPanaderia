const renderLogin = () => {
  const loginRoot = document.getElementById("login-root");
  if (!loginRoot) return;

  loginRoot.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="url(#grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              <path d="M14 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="24" cy="20" r="4" fill="white" opacity="0.9"/>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#6366f1"/>
                  <stop offset="1" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Bienvenido</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form class="login-form" id="login-form" novalidate>
          <div class="form-group" id="group-correo">
            <label for="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="tu@correo.com"
              autocomplete="email"
              required
            />
            <span class="field-error" id="error-correo"></span>
          </div>

          <div class="form-group" id="group-password">
            <label for="password">Contraseña</label>
            <div class="password-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button type="button" class="toggle-password" id="toggle-password" aria-label="Mostrar contraseña">
                <svg class="eye-icon eye-show" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg class="eye-icon eye-hide" viewBox="0 0 24 24" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span class="field-error" id="error-password"></span>
          </div>

          <div id="login-global-error" class="global-error" style="display:none"></div>

          <button type="submit" class="btn-login" id="btn-login-submit">
            <span class="btn-text">Iniciar Sesión</span>
            <span class="btn-spinner" style="display:none">
              <svg class="spinner-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.416" stroke-dashoffset="10"/>
              </svg>
              Verificando...
            </span>
          </button>
        </form>
      </div>
    </div>
  `;

  _initLoginHandlers();
};

const _initLoginHandlers = () => {
  const form = document.getElementById("login-form");
  const correoInput = document.getElementById("correo");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const btnSubmit = document.getElementById("btn-login-submit");
  const btnText = btnSubmit?.querySelector(".btn-text");
  const btnSpinner = btnSubmit?.querySelector(".btn-spinner");
  const globalError = document.getElementById("login-global-error");

  // ── Toggle visibilidad contraseña ──────────────────────────────────
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.querySelector(".eye-show").style.display = isPassword
        ? "none"
        : "";
      togglePasswordBtn.querySelector(".eye-hide").style.display = isPassword
        ? ""
        : "none";
    });
  }

  // ── Limpiar errores al escribir ────────────────────────────────────
  correoInput?.addEventListener("input", () => clearFieldError("correo"));
  passwordInput?.addEventListener("input", () => clearFieldError("password"));

  // ── Submit ─────────────────────────────────────────────────────────
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = correoInput?.value.trim();
    const password = passwordInput?.value;

    // Validación básica del lado cliente
    let hasError = false;
    if (!correo) {
      showFieldError("correo", "El correo es obligatorio.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      showFieldError("correo", "Ingresa un correo válido.");
      hasError = true;
    }
    if (!password) {
      showFieldError("password", "La contraseña es obligatoria.");
      hasError = true;
    } else if (password.length < 6) {
      showFieldError(
        "password",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      hasError = true;
    }

    if (hasError) return;

    // Mostrar spinner
    setLoading(true, btnText, btnSpinner, btnSubmit);
    hideGlobalError(globalError);

    try {
      // Llamada real a la API
      const data = await API.Auth.login({ correo, password });

      // Rol del usuario (desde userInfo persistido o desde el token)
      const userInfo = _getUserInfo(data);
      const role = userInfo?.nombre_rol;

      if (typeof window.showSuccess === "function") {
        window.showSuccess("¡Bienvenido!", `Sesión iniciada correctamente.`);
      }

      // Pequeño delay para que el toast sea visible antes de navegar
      setTimeout(() => {
        _redirectByRole(role);
      }, 600);
    } catch (err) {
      setLoading(false, btnText, btnSpinner, btnSubmit);
      const message = _resolveErrorMessage(err);
      showGlobalError(globalError, message);

      if (typeof window.showError === "function") {
        window.showError("Error de acceso", message);
      }
    }
  });
};

/* ── Helpers ─────────────────────────────────────────────── */

const _getUserInfo = (loginData) => {
  // El Auth.login() ya guardó userInfo en localStorage
  try {
    const stored = localStorage.getItem("userInfo");
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  // Fallback: intentar leer del token
  if (typeof ROUTES !== "undefined") {
    const role = ROUTES.getUserRole();
    return role ? { nombre_rol: role } : null;
  }
  return null;
};

const _redirectByRole = (role) => {
  const origin = window.location.origin;

  if (role === "Admin") {
    window.location.replace(`${origin}/frontend/public/admin/homeAdmin.html`);
    return;
  }
  if (role === "Empleado") {
    window.location.replace(
      `${origin}/frontend/public/Empleado/asistenciaEmpleado.html`,
    );
    return;
  }

  // Si el módulo ROUTES está disponible, usarlo como fallback
  if (typeof ROUTES !== "undefined") {
    ROUTES.redirectToRoleHome();
    return;
  }

  // Última opción: mostrar error de rol desconocido
  const globalError = document.getElementById("login-global-error");
  if (globalError) {
    showGlobalError(
      globalError,
      `Rol no reconocido: "${role}". Contacta al administrador.`,
    );
  }
};

const _resolveErrorMessage = (err) => {
  if (err?.status === 401) return "Correo o contraseña incorrectos.";
  if (err?.status === 403)
    return (
      err.message || "Tu cuenta no está activa. Contacta al administrador."
    );
  if (err?.message === "REQUEST_TIMEOUT")
    return "El servidor tardó demasiado. Intenta de nuevo.";
  if (!navigator.onLine) return "Sin conexión a internet.";
  return err?.message || "Error inesperado. Intenta de nuevo.";
};

const setLoading = (loading, btnText, btnSpinner, btnSubmit) => {
  if (!btnSubmit) return;
  btnSubmit.disabled = loading;
  if (btnText) btnText.style.display = loading ? "none" : "";
  if (btnSpinner) btnSpinner.style.display = loading ? "inline-flex" : "none";
};

const showFieldError = (field, message) => {
  const errorEl = document.getElementById(`error-${field}`);
  const groupEl = document.getElementById(`group-${field}`);
  if (errorEl) errorEl.textContent = message;
  if (groupEl) groupEl.classList.add("has-error");
};

const clearFieldError = (field) => {
  const errorEl = document.getElementById(`error-${field}`);
  const groupEl = document.getElementById(`group-${field}`);
  if (errorEl) errorEl.textContent = "";
  if (groupEl) groupEl.classList.remove("has-error");
};

const showGlobalError = (el, message) => {
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
};

const hideGlobalError = (el) => {
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
};

window.addEventListener("DOMContentLoaded", renderLogin);
