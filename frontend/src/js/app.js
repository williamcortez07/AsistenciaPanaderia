document.addEventListener("DOMContentLoaded", function () {
  console.log("Frontend de Asistencia Panadería iniciado");

  const actionButtons = document.querySelectorAll("button");
  actionButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      console.log(`Botón pulsado: ${button.textContent.trim()}`);
    });
  });
});
