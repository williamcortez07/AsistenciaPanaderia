class Loader {
  constructor(options = {}) {
    this.text = options.text || "Cargando...";
    this.showProgress = options.showProgress || false;
    this.overlay = null;
    this.progressBar = null;
    this._create();
  }

  _create() {
    // Crear overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "loader-overlay";
    if (this.showProgress) this.overlay.classList.add("has-progress");
    this.overlay.setAttribute("role", "status");
    this.overlay.setAttribute("aria-live", "polite");
    this.overlay.setAttribute("aria-label", this.text);

    // Spinner
    const spinner = document.createElement("div");
    spinner.className = "loader-spinner";
    const orbit = document.createElement("div");
    orbit.className = "loader-orbit";
    spinner.appendChild(orbit);

    // Texto
    const text = document.createElement("div");
    text.className = "loader-text";
    text.textContent = this.text;

    // Barra de progreso
    const progressContainer = document.createElement("div");
    progressContainer.className = "loader-progress-container";
    this.progressBar = document.createElement("div");
    this.progressBar.className = "loader-progress-bar";
    progressContainer.appendChild(this.progressBar);

    this.overlay.appendChild(spinner);
    this.overlay.appendChild(text);
    this.overlay.appendChild(progressContainer);
    document.body.appendChild(this.overlay);
  }

  show(text) {
    if (text) {
      const textEl = this.overlay.querySelector(".loader-text");
      if (textEl) textEl.textContent = text;
    }
    this.overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  hide() {
    this.overlay.classList.remove("active");
    document.body.style.overflow = "";
    this.setProgress(0);
  }

  setProgress(percent) {
    if (this.progressBar) {
      this.progressBar.style.width = Math.min(100, Math.max(0, percent)) + "%";
    }
  }

  destroy() {
    this.hide();
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 350);
  }
}

/* Uso:
   const loader = new Loader({ text: 'Iniciando sesión...', showProgress: true });
   loader.show();
   loader.setProgress(50);
   loader.hide();
   loader.destroy();
*/

// Helper global
window.showLoader = (text, showProgress = false) => {
  window._currentLoader = new Loader({ text, showProgress });
  window._currentLoader.show();
  return window._currentLoader;
};

window.hideLoader = () => {
  if (window._currentLoader) {
    window._currentLoader.hide();
    setTimeout(() => window._currentLoader.destroy(), 400);
  }
};
