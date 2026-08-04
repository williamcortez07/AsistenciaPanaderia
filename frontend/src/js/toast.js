const ToastIcons = {
  success: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
  error: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  warning: `<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
  info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

class Toast {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.setAttribute("role", "region");
      this.container.setAttribute("aria-live", "polite");
      document.body.appendChild(this.container);
    }
  }

  show(options = {}) {
    const {
      type = "info",
      title = "",
      message = "",
      duration = 4000,
      dismissible = true,
    } = options;

    this._ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");

    // Icono
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "toast-icon";
    iconWrapper.innerHTML = ToastIcons[type] || ToastIcons.info;

    // Contenido
    const content = document.createElement("div");
    content.className = "toast-content";

    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "toast-title";
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    if (message) {
      const msgEl = document.createElement("div");
      msgEl.className = "toast-message";
      msgEl.textContent = message;
      content.appendChild(msgEl);
    }

    toast.appendChild(iconWrapper);
    toast.appendChild(content);

    // Barra de progreso
    if (duration > 0) {
      const progress = document.createElement("div");
      progress.className = "toast-progress";
      progress.style.animationDuration = `${duration}ms`;
      toast.appendChild(progress);
    }

    // Botón cerrar
    if (dismissible) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "toast-close";
      closeBtn.setAttribute("aria-label", "Cerrar notificación");
      closeBtn.innerHTML = ToastIcons.close;
      closeBtn.addEventListener("click", () => this._remove(toast));
      toast.appendChild(closeBtn);
    }

    this.container.appendChild(toast);

    // Auto-cerrar
    let autoCloseTimer;
    if (duration > 0) {
      autoCloseTimer = setTimeout(() => this._remove(toast), duration);
    }

    // Pausar al hover
    toast.addEventListener("mouseenter", () => {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      const progress = toast.querySelector(".toast-progress");
      if (progress) progress.style.animationPlayState = "paused";
    });

    toast.addEventListener("mouseleave", () => {
      const progress = toast.querySelector(".toast-progress");
      if (progress) {
        progress.style.animationPlayState = "running";
        // Reanudar timer aproximado
        const remaining = duration * 0.5; // simplificado
        autoCloseTimer = setTimeout(() => this._remove(toast), remaining);
      }
    });

    return toast;
  }

  _remove(toast) {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }
}

// Instancia global
const toast = new Toast();

// Helpers globales
window.showToast = (options) => toast.show(options);
window.showSuccess = (title, message, duration) =>
  toast.show({ type: "success", title, message, duration });
window.showError = (title, message, duration) =>
  toast.show({ type: "error", title, message, duration });
window.showWarning = (title, message, duration) =>
  toast.show({ type: "warning", title, message, duration });
window.showInfo = (title, message, duration) =>
  toast.show({ type: "info", title, message, duration });
