import * as planillaRepository from "./planillaRepository.js";
import { AppError } from "../../utils/appError.js";

export const createPlanillaService = async ({ mes, anio }) => {
  const mesNum = Number(mes);
  const anioNum = Number(anio);

  if (!mesNum || mesNum < 1 || mesNum > 12) {
    throw new AppError("El mes debe ser un número entero entre 1 y 12", 400);
  }

  if (!anioNum || anioNum < 2000) {
    throw new AppError(
      "El año debe ser un número entero mayor o igual a 2000",
      400,
    );
  }

  const existingPlanilla = await planillaRepository.getPlanillaByMesAnio(
    mesNum,
    anioNum,
  );
  if (existingPlanilla) {
    throw new AppError(
      `Ya existe una planilla generada para el período ${mesNum}/${anioNum}`,
      409,
    );
  }

  try {
    const nuevaPlanilla = await planillaRepository.generarPlanillaCompletaTx({
      mes: mesNum,
      anio: anioNum,
    });
    return nuevaPlanilla;
  } catch (err) {
    if (err.message === "NO_ACTIVE_EMPLOYEES") {
      throw new AppError(
        "No se puede generar la planilla: No hay empleados activos registrados en el sistema",
        400,
      );
    }
    throw err;
  }
};

export const getPlanillasService = async ({
  page = 1,
  limit = 10,
  anio,
  mes,
  estado,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await planillaRepository.getPlanillas(
    limitNum,
    offset,
    anio ? Number(anio) : null,
    mes ? Number(mes) : null,
    estado,
  );

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getPlanillaByIdService = async (id) => {
  const planilla = await planillaRepository.getPlanillaById(id);
  if (!planilla) {
    throw new AppError("Planilla no encontrada", 404);
  }
  return planilla;
};

export const getDetallePlanillaService = async (id_planilla) => {
  const planilla = await planillaRepository.getPlanillaById(id_planilla);
  if (!planilla) {
    throw new AppError("Planilla no encontrada", 404);
  }

  const detalles =
    await planillaRepository.getDetallesByPlanillaId(id_planilla);

  // Totales acumulados para resumen
  const resumen = detalles.reduce(
    (acc, item) => {
      acc.total_salario_base += Number(item.salario_base);
      acc.total_deducciones += Number(item.total_deduccion);
      acc.total_salario_neto += Number(item.salario_neto);
      return acc;
    },
    { total_salario_base: 0, total_deducciones: 0, total_salario_neto: 0 },
  );

  return {
    planilla,
    resumen,
    detalles,
  };
};

export const updatePlanillaEstadoService = async (id, { estado }) => {
  const estadoPermitido = ["pagada", "anulada"];
  if (!estado || !estadoPermitido.includes(estado)) {
    throw new AppError(
      "El estado solo puede ser actualizado a 'pagada' o 'anulada'",
      400,
    );
  }

  const existingPlanilla = await planillaRepository.getPlanillaById(id);
  if (!existingPlanilla) {
    throw new AppError("Planilla no encontrada", 404);
  }

  if (existingPlanilla.estado === "anulada") {
    throw new AppError("Una planilla anulada no puede cambiar de estado", 400);
  }

  const updatedPlanilla = await planillaRepository.updatePlanillaEstado(
    id,
    estado,
  );
  return updatedPlanilla;
};
