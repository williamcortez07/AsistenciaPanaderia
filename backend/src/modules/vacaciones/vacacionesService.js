import * as vacacionRepository from "./vacacionesRepository.js";
import * as empleadoRepository from "../empleados/empleadoRepository.js";
import { AppError } from "../../utils/appError.js";

export const createVacacionService = async (vacacionData) => {
  const { id_empleado, fecha_inicio, fecha_fin, dias, motivo } =
    vacacionData ?? {};

  if (!id_empleado) {
    throw new AppError("El campo 'id_empleado' es requerido", 400);
  }

  const empleado = await empleadoRepository.getEmpleadoById(id_empleado);
  if (!empleado) {
    throw new AppError("El empleado especificado no existe", 404);
  }

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new AppError("Las fechas proporcionadas no son válidas", 400);
  }

  if (fin < inicio) {
    throw new AppError(
      "La fecha final (fecha_fin) debe ser mayor o igual a la fecha inicial (fecha_inicio)",
      400,
    );
  }

  if (!dias || Number(dias) <= 0) {
    throw new AppError("El número de días debe ser mayor a 0", 400);
  }

  const newVacacion = await vacacionRepository.createVacacion({
    id_empleado,
    fecha_inicio,
    fecha_fin,
    dias: Number(dias),
    motivo: motivo ? motivo.trim() : null,
  });

  return newVacacion;
};

export const getVacacionesService = async ({
  page = 1,
  limit = 10,
  id_empleado,
  fecha_desde,
  fecha_hasta,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await vacacionRepository.getVacaciones({
    limit: limitNum,
    offset,
    id_empleado,
    fecha_desde,
    fecha_hasta,
  });

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

export const getVacacionByIdService = async (id) => {
  const vacacion = await vacacionRepository.getVacacionById(id);
  if (!vacacion) {
    throw new AppError("Registro de vacaciones no encontrado", 404);
  }
  return vacacion;
};

export const updateVacacionService = async (id, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const existingVacacion = await vacacionRepository.getVacacionById(id);
  if (!existingVacacion) {
    throw new AppError("Registro de vacaciones no encontrado", 404);
  }

  const formattedData = {};

  const inicio = updateData.fecha_inicio
    ? new Date(updateData.fecha_inicio)
    : new Date(existingVacacion.fecha_inicio);
  const fin = updateData.fecha_fin
    ? new Date(updateData.fecha_fin)
    : new Date(existingVacacion.fecha_fin);

  if (fin < inicio) {
    throw new AppError(
      "La fecha final (fecha_fin) debe ser mayor o igual a la fecha inicial (fecha_inicio)",
      400,
    );
  }

  if (updateData.fecha_inicio !== undefined)
    formattedData.fecha_inicio = updateData.fecha_inicio;
  if (updateData.fecha_fin !== undefined)
    formattedData.fecha_fin = updateData.fecha_fin;

  if (updateData.dias !== undefined) {
    if (Number(updateData.dias) <= 0) {
      throw new AppError("El número de días debe ser mayor a 0", 400);
    }
    formattedData.dias = Number(updateData.dias);
  }

  if (updateData.motivo !== undefined) {
    formattedData.motivo = updateData.motivo ? updateData.motivo.trim() : null;
  }

  const updatedVacacion = await vacacionRepository.updateVacacion(
    id,
    formattedData,
  );
  return updatedVacacion;
};
