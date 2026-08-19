const API_BASE_URL = "https://asistenciapanaderia.onrender.com/api/v1";

const apiConfig = {
  baseURL: API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // ms
  retries: 1,
};

const tokenStore = {
  get access() {
    return localStorage.getItem("accessToken");
  },
  set access(token) {
    localStorage.setItem("accessToken", token);
  },
  get refresh() {
    return localStorage.getItem("refreshToken");
  },
  set refresh(token) {
    localStorage.setItem("refreshToken", token);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
  },
};

// Helper: timeout wrapper para fetch
function fetchWithTimeout(url, options, timeout = apiConfig.timeout) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), timeout),
    ),
  ]);
}

// Helper: construir query string
function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) return "";
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : "";
}

// Helper: manejar respuesta
async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `HTTP ${response.status}`,
    );
    error.status = response.status;
    error.data = data;
    error.response = response;
    throw error;
  }

  return data;
}

async function httpRequest(method, endpoint, body = null, options = {}) {
  const url = `${apiConfig.baseURL}${endpoint}`;
  const headers = { ...apiConfig.defaultHeaders, ...options.headers };

  const accessToken = tokenStore.access;
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const fetchOptions = {
    method: method.toUpperCase(),
    headers,
    ...options.fetchOptions,
  };

  if (body !== null) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let lastError;
  const attempts = options.noRetry ? 1 : apiConfig.retries + 1;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        fetchOptions,
        apiConfig.timeout,
      );
      return await handleResponse(response);
    } catch (error) {
      lastError = error;
      if (error.status === 401 && !options.skipRefresh) {
        try {
          await Auth.refresh();
          // Reintentar con nuevo token
          const newToken = tokenStore.access;
          fetchOptions.headers["Authorization"] = `Bearer ${newToken}`;
          continue;
        } catch (refreshError) {
          tokenStore.clear();
          window.dispatchEvent(new CustomEvent("api:unauthorized"));
          throw refreshError;
        }
      }

      // Reintentar solo en errores de red o timeout
      if (
        attempt < attempts &&
        (error.message === "REQUEST_TIMEOUT" || !error.status)
      ) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

// Shorthand methods
const get = (endpoint, params, options) =>
  httpRequest("GET", endpoint + buildQueryString(params), null, options);
const post = (endpoint, body, options) =>
  httpRequest("POST", endpoint, body, options);
const put = (endpoint, body, options) =>
  httpRequest("PUT", endpoint, body, options);
const patch = (endpoint, body, options) =>
  httpRequest("PATCH", endpoint, body, options);
const del = (endpoint, options) =>
  httpRequest("DELETE", endpoint, null, options);

/* ============================================================
   ENDPOINTS - VACACIONES
   ============================================================ */

const Vacaciones = {
  /** GET /api/v1/vacaciones - Listar todas las vacaciones */
  listar: (params) => get("/vacaciones", params),

  /** POST /api/v1/vacaciones - Crear solicitud de vacaciones */
  crear: (data) => post("/vacaciones", data),

  /** GET /api/v1/vacaciones/{id} - Obtener vacación por ID */
  obtener: (id) => get(`/vacaciones/${id}`),

  /** PUT /api/v1/vacaciones/{id} - Actualizar vacación */
  actualizar: (id, data) => put(`/vacaciones/${id}`, data),
};

/* ============================================================
   ENDPOINTS - USUARIOS
   ============================================================ */

const Usuarios = {
  /** POST /api/v1/usuarios/login - Login de usuario (legacy) */
  loginLegacy: (credentials) =>
    post("/usuarios/login", credentials, { skipRefresh: true }),

  /** POST /api/v1/usuarios - Crear usuario */
  crear: (data) => post("/usuarios", data),

  /** GET /api/v1/usuarios - Listar usuarios */
  listar: (params) => get("/usuarios", params),

  /** GET /api/v1/usuarios/{id} - Obtener usuario por ID */
  obtener: (id) => get(`/usuarios/${id}`),

  /** PUT /api/v1/usuarios/{id} - Actualizar usuario */
  actualizar: (id, data) => put(`/usuarios/${id}`, data),
};

/* ============================================================
   ENDPOINTS - ROLES
   ============================================================ */

const Roles = {
  /** POST /api/v1/roles - Crear rol */
  crear: (data) => post("/roles", data),

  /** GET /api/v1/roles - Listar roles */
  listar: (params) => get("/roles", params),

  /** GET /api/v1/roles/{id} - Obtener rol por ID */
  obtener: (id) => get(`/roles/${id}`),

  /** PUT /api/v1/roles/{id} - Actualizar rol */
  actualizar: (id, data) => put(`/roles/${id}`, data),
};

/* ============================================================
   ENDPOINTS - PLANILLA
   ============================================================ */

const Planilla = {
  /** POST /api/v1/planilla - Crear planilla */
  crear: (data) => post("/planilla", data),

  /** GET /api/v1/planilla - Listar planillas */
  listar: (params) => get("/planilla", params),

  /** GET /api/v1/planilla/{id} - Obtener planilla por ID */
  obtener: (id) => get(`/planilla/${id}`),

  /** GET /api/v1/planilla/{id}/detalle - Obtener detalle de planilla */
  detalle: (id) => get(`/planilla/${id}/detalle`),

  /** PATCH /api/v1/planilla/{id}/estado - Cambiar estado de planilla */
  cambiarEstado: (id, estadoData) =>
    patch(`/planilla/${id}/estado`, estadoData),
};

/* ============================================================
   ENDPOINTS - EMPLEADOS
   ============================================================ */

const Empleados = {
  /** POST /api/v1/empleados - Crear empleado */
  crear: (data) => post("/empleados", data),

  /** GET /api/v1/empleados - Listar empleados */
  listar: (params) => get("/empleados", params),

  /** GET /api/v1/empleados/codigo/{codigo} - Buscar por código */
  porCodigo: (codigo) => get(`/empleados/codigo/${encodeURIComponent(codigo)}`),

  /** GET /api/v1/empleados/{id} - Obtener empleado por ID */
  obtener: (id) => get(`/empleados/${id}`),

  /** PUT /api/v1/empleados/{id} - Actualizar empleado */
  actualizar: (id, data) => put(`/empleados/${id}`, data),

  /** POST /api/v1/empleados/{id}/deducciones - Agregar deducción */
  agregarDeduccion: (id, data) => post(`/empleados/${id}/deducciones`, data),

  /** GET /api/v1/empleados/{id}/deducciones - Listar deducciones del empleado */
  listarDeducciones: (id) => get(`/empleados/${id}/deducciones`),

  /** DELETE /api/v1/empleados/{id}/deducciones/{deduccionId} - Eliminar deducción */
  eliminarDeduccion: (id, deduccionId) =>
    del(`/empleados/${id}/deducciones/${deduccionId}`),
};

/* ============================================================
   ENDPOINTS - DEDUCCIONES
   ============================================================ */

const Deducciones = {
  /** POST /api/v1/deducciones - Crear deducción */
  crear: (data) => post("/deducciones", data),

  /** GET /api/v1/deducciones - Listar deducciones */
  listar: (params) => get("/deducciones", params),

  /** GET /api/v1/deducciones/nombre/{nombre} - Buscar por nombre */
  porNombre: (nombre) =>
    get(`/deducciones/nombre/${encodeURIComponent(nombre)}`),

  /** GET /api/v1/deducciones/{id} - Obtener deducción por ID */
  obtener: (id) => get(`/deducciones/${id}`),

  /** PUT /api/v1/deducciones/{id} - Actualizar deducción */
  actualizar: (id, data) => put(`/deducciones/${id}`, data),
};

/* ============================================================
   ENDPOINTS - CARGOS
   ============================================================ */

const Cargos = {
  /** POST /api/v1/cargos - Crear cargo */
  crear: (data) => post("/cargos", data),

  /** GET /api/v1/cargos - Listar cargos */
  listar: (params) => get("/cargos", params),

  /** GET /api/v1/cargos/nombre/{nombre} - Buscar por nombre */
  porNombre: (nombre) => get(`/cargos/nombre/${encodeURIComponent(nombre)}`),

  /** GET /api/v1/cargos/{id} - Obtener cargo por ID */
  obtener: (id) => get(`/cargos/${id}`),

  /** PUT /api/v1/cargos/{id} - Actualizar cargo */
  actualizar: (id, data) => put(`/cargos/${id}`, data),
};

/* ============================================================
   ENDPOINTS - AUTENTICACIÓN (AUTH)
   ============================================================ */

const Auth = {
  /** POST /api/v1/auth/login - Login con credenciales */
  login: async (credentials) => {
    const raw = await post("/auth/login", credentials, { skipRefresh: true });
    // El backend envuelve la respuesta en { success, message, data: { accessToken, refreshToken, user } }
    const data = raw?.data ?? raw;
    if (data.accessToken) tokenStore.access = data.accessToken;
    if (data.refreshToken) tokenStore.refresh = data.refreshToken;
    if (data.token) tokenStore.access = data.token; // fallback
    // Persistir info del usuario para acceso sin necesidad de decodificar el JWT
    if (data.user) localStorage.setItem("userInfo", JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent("api:login", { detail: data }));
    return data;
  },

  /** POST /api/v1/auth/refresh - Refrescar token */
  refresh: async () => {
    const refreshToken = tokenStore.refresh;
    if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
    const data = await post(
      "/auth/refresh",
      { refreshToken },
      { skipRefresh: true },
    );
    if (data.accessToken) tokenStore.access = data.accessToken;
    if (data.token) tokenStore.access = data.token;
    return data;
  },

  /** POST /api/v1/auth/logout - Cerrar sesión */
  logout: async () => {
    try {
      await post("/auth/logout", {}, { skipRefresh: true });
    } catch (e) {
      // Ignorar errores en logout
    } finally {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent("api:logout"));
    }
  },

  /** GET /api/v1/auth/me - Obtener usuario autenticado */
  me: () => get("/auth/me"),

  /** Verificar si hay sesión activa */
  isAuthenticated: () => !!tokenStore.access,

  /** Obtener token actual */
  getToken: () => tokenStore.access,

  /** Configurar tokens manualmente */
  setTokens: (access, refresh) => {
    tokenStore.access = access;
    if (refresh) tokenStore.refresh = refresh;
  },
};

/* ============================================================
   ENDPOINTS - ASISTENCIA
   ============================================================ */

const Asistencia = {
  /** POST /api/v1/asistencia/check-in - Registrar entrada */
  checkIn: (data) => post("/asistencia/check-in", data),

  /** POST /api/v1/asistencia/check-out - Registrar salida */
  checkOut: (data) => post("/asistencia/check-out", data),

  /** GET /api/v1/asistencia - Listar registros de asistencia */
  listar: (params) => get("/asistencia", params),

  /** GET /api/v1/asistencia/{id} - Obtener registro por ID */
  obtener: (id) => get(`/asistencia/${id}`),

  /** PUT /api/v1/asistencia/{id} - Actualizar registro */
  actualizar: (id, data) => put(`/asistencia/${id}`, data),
};

/* ============================================================
   ENDPOINTS - EVALUACIÓN AL DESEMPEÑO
   ============================================================ */

const Evaluaciones = {
  // Dashboard & Métricas
  obtenerDashboardStats: (params) => get("/evaluaciones/dashboard/stats", params),

  // Periodos de Evaluación (6 meses)
  listarPeriodos: (params) => get("/evaluaciones/periodos", params),
  crearPeriodo: (data) => post("/evaluaciones/periodos", data),
  obtenerPeriodo: (id) => get(`/evaluaciones/periodos/${id}`),
  actualizarPeriodo: (id, data) => put(`/evaluaciones/periodos/${id}`, data),
  cambiarEstadoPeriodo: (id, estadoData) =>
    patch(`/evaluaciones/periodos/${id}/estado`, estadoData),

  // Catálogo de Criterios (Checklist Base)
  listarCriterios: (params) => get("/evaluaciones/criterios", params),
  crearCriterio: (data) => post("/evaluaciones/criterios", data),
  obtenerCriterio: (id) => get(`/evaluaciones/criterios/${id}`),
  actualizarCriterio: (id, data) => put(`/evaluaciones/criterios/${id}`, data),
  eliminarCriterio: (id) => del(`/evaluaciones/criterios/${id}`),

  // Preguntas del Checklist
  listarPreguntas: (params) => get("/evaluaciones/preguntas", params),
  crearPregunta: (data) => post("/evaluaciones/preguntas", data),
  obtenerPregunta: (id) => get(`/evaluaciones/preguntas/${id}`),
  actualizarPregunta: (id, data) => put(`/evaluaciones/preguntas/${id}`, data),
  eliminarPregunta: (id) => del(`/evaluaciones/preguntas/${id}`),

  // Criterios / Ponderación del Periodo
  listarCriteriosPeriodo: (id_periodo) =>
    get(`/evaluaciones/periodos/${id_periodo}/criterios`),
  agregarCriterioPeriodo: (id_periodo, data) =>
    post(`/evaluaciones/periodos/${id_periodo}/criterios`, data),
  actualizarCriterioPeriodo: (id_periodo, id, data) =>
    put(`/evaluaciones/periodos/${id_periodo}/criterios/${id}`, data),
  eliminarCriterioPeriodo: (id_periodo, id) =>
    del(`/evaluaciones/periodos/${id_periodo}/criterios/${id}`),

  // Evaluaciones de Desempeño
  listarEvaluaciones: (params) => get("/evaluaciones", params),
  crearEvaluacion: (data) => post("/evaluaciones", data),
  obtenerEvaluacion: (id) => get(`/evaluaciones/${id}`),
  actualizarEvaluacion: (id, data) => put(`/evaluaciones/${id}`, data),
  cambiarEstadoEvaluacion: (id, estadoData) =>
    patch(`/evaluaciones/${id}/estado`, estadoData),
  calcularEvaluacion: (id) => post(`/evaluaciones/${id}/calcular`, {}),

  // Respuestas Detalladas Checklist Bulk
  obtenerRespuestas: (id_evaluacion) =>
    get(`/evaluaciones/${id_evaluacion}/respuestas`),
  guardarRespuestasBulk: (id_evaluacion, data) =>
    put(`/evaluaciones/${id_evaluacion}/respuestas/bulk`, data),

  // Resultados Checklist Bulk (Alias)
  obtenerResultados: (id_evaluacion) =>
    get(`/evaluaciones/${id_evaluacion}/resultados`),
  guardarResultadosBulkLegacy: (id_evaluacion, data) =>
    put(`/evaluaciones/${id_evaluacion}/resultados/bulk`, data),

  // Objetivos de Empleado
  listarObjetivos: (params) => get("/evaluaciones/objetivos", params),
  crearObjetivo: (data) => post("/evaluaciones/objetivos", data),
  obtenerObjetivo: (id) => get(`/evaluaciones/objetivos/${id}`),
  actualizarObjetivo: (id, data) => put(`/evaluaciones/objetivos/${id}`, data),
  eliminarObjetivo: (id) => del(`/evaluaciones/objetivos/${id}`),

  // Planes de Mejora Continua
  listarPlanesMejora: (params) => get("/evaluaciones/planes-mejora", params),
  crearPlanMejora: (data) => post("/evaluaciones/planes-mejora", data),
  obtenerPlanMejora: (id) => get(`/evaluaciones/planes-mejora/${id}`),
  actualizarPlanMejora: (id, data) => put(`/evaluaciones/planes-mejora/${id}`, data),
  eliminarPlanMejora: (id) => del(`/evaluaciones/planes-mejora/${id}`),
};

/* ============================================================
   HEALTH & DOCS
   ============================================================ */

const Health = {
  /** GET /health - Estado del servidor */
  check: () =>
    fetch(`${API_BASE_URL.replace("/api/v1", "")}/health`).then((r) =>
      r.json(),
    ),
};

const Docs = {
  /** GET /api/v1/docs.json - Swagger JSON */
  swaggerJSON: () => get("/docs.json", null, { skipRefresh: true }),
};

/* ============================================================
   EXPORTACIÓN GLOBAL
   ============================================================ */

const API = {
  config: apiConfig,
  tokenStore,
  http: { get, post, put, patch, delete: del, request: httpRequest },
  Vacaciones,
  Usuarios,
  Roles,
  Planilla,
  Empleados,
  Deducciones,
  Cargos,
  Auth,
  Asistencia,
  Evaluaciones,
  Health,
  Docs,
};

// Exportar para módulos ES6
if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
}

// Exponer globalmente para uso directo en navegador
if (typeof window !== "undefined") {
  window.API = API;
}

// Las operaciones de empleados y usuarios se realizan a través de window.API:
//   window.API.Empleados.listar()
//   window.API.Empleados.crear(data)
//   window.API.Usuarios.crear(data)
// No se necesitan funciones de fetch separadas.
