const ROUTES = (() => {
  const PATHS = {
    login: "/index.html",
    adminHome: "/admin/homeAdmin.html",
    empleadoHome: "/Empleado/homeEmpleado.html",
  };

  const PROTECTED_ROUTES = [
    { prefix: "/admin/", allowedRoles: ["Admin"] },
    { prefix: "/Empleado/", allowedRoles: ["Empleado"] },
  ];

  const PUBLIC_PAGES = new Set(["", "index.html", "login.html"]);

  const getAccessToken = () => localStorage.getItem("accessToken");

  const parseJwtPayload = (token) => {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    try {
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(payload);
      const uriEncoded = decoded
        .split("")
        .map((char) => `%${("00" + char.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("");
      return JSON.parse(decodeURIComponent(uriEncoded));
    } catch (error) {
      return null;
    }
  };

  const normalizeRole = (roleValue) => {
    if (!roleValue) return null;
    if (typeof roleValue === "string") return roleValue;
    if (Array.isArray(roleValue)) {
      const first = roleValue[0];
      if (typeof first === "string") return first;
      return first?.name || first?.nombre_rol || first?.rol || null;
    }
    if (typeof roleValue === "object") {
      return roleValue.name || roleValue.nombre_rol || roleValue.rol || null;
    }
    return null;
  };

  const getUserRole = () => {
    const token = getAccessToken();
    if (!token) return null;

    const payload = parseJwtPayload(token);
    if (!payload) return null;

    // El backend incluye nombre_rol directamente en el payload
    return (
      normalizeRole(payload.nombre_rol) ||
      normalizeRole(payload.role) ||
      normalizeRole(payload.rol) ||
      normalizeRole(payload.roles) ||
      normalizeRole(payload.authorities) ||
      normalizeRole(payload.perfil)
    );
  };

  const redirectToLogin = (forbidden = false) => {
    const loginUrl = new URL(`${window.location.origin}${PATHS.login}`);
    if (forbidden) {
      loginUrl.searchParams.set("error", "forbidden");
    }
    window.location.replace(loginUrl.toString());
  };

  const redirectToRoleHome = () => {
    const role = getUserRole();
    if (role === "Admin") {
      window.location.replace(`${window.location.origin}${PATHS.adminHome}`);
      return;
    }

    if (role === "Empleado") {
      window.location.replace(`${window.location.origin}${PATHS.empleadoHome}`);
      return;
    }

    redirectToLogin();
  };

  const getProtectedRoute = (pathname) =>
    PROTECTED_ROUTES.find((route) => pathname.startsWith(route.prefix));

  const routeCheck = () => {
    const pathname = window.location.pathname;
    const currentPage = pathname.split("/").pop();
    const token = getAccessToken();
    const role = getUserRole();

    if (PUBLIC_PAGES.has(currentPage)) {
      if (token && role) {
        redirectToRoleHome();
      }
      return;
    }

    const protectedRoute = getProtectedRoute(pathname);
    if (!protectedRoute) {
      return;
    }

    if (!token || !role) {
      redirectToLogin();
      return;
    }

    if (!protectedRoute.allowedRoles.includes(role)) {
      redirectToLogin(true);
      return;
    }
  };

  return {
    init: routeCheck,
    redirectToRoleHome,
    getUserRole,
    getAccessToken,
    redirectToLogin,
  };
})();

window.addEventListener("DOMContentLoaded", () => {
  if (typeof ROUTES !== "undefined") {
    ROUTES.init();
  }
});
