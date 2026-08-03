import * as asistenciaRepository from "./asistenciaRepository.js";
import * as empleadoRepository from "../empleados/empleadoRepository.js";
import { AppError } from "../../utils/appError.js";

// Helper para obtener fecha actual formateada en YYYY-MM-DD local
const getTodayFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper para obtener hora actual formateada en HH:mm:ss
const getCurrentTimeFormatted = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const checkInService = async ({ id_empleado, observacion }) => {
  if (!id_empleado) {
    throw new AppError("El campo 'id_empleado' es requerido", 400);
  }

  const empleado = await empleadoRepository.getEmpleadoById(id_empleado);
  if (!empleado) {
    throw new AppError("El empleado especificado no existe", 404);
  }

  if (empleado.estado !== "activo") {
    throw new AppError(
      `No se puede marcar asistencia para un empleado con estado '${empleado.estado}'`,
      400,
    );
  }

  const fechaHoy = getTodayFormatted();
  const horaActual = getCurrentTimeFormatted();

  const existingAsistencia =
    await asistenciaRepository.getAsistenciaByEmpleadoAndFecha(
      id_empleado,
      fechaHoy,
    );

  if (existingAsistencia) {
    throw new AppError(
      "El empleado ya registró su entrada para el día de hoy",
      409,
    );
  }

  // Evaluación de tardanza según el horario asignado al cargo
  let estado = "presente";
  if (empleado.horario_entrada) {
    if (horaActual > empleado.horario_entrada) {
      estado = "tardanza";
    }
  }

  const newAsistencia = await asistenciaRepository.createCheckIn({
    id_empleado,
    fecha: fechaHoy,
    hora_entrada: horaActual,
    estado,
    observacion: observacion ? observacion.trim() : null,
  });

  return newAsistencia;
};

export const checkOutService = async ({ id_empleado, observacion }) => {
  if (!id_empleado) {
    throw new AppError("El campo 'id_empleado' es requerido", 400);
  }

  const fechaHoy = getTodayFormatted();
  const horaActual = getCurrentTimeFormatted();

  const existingAsistencia =
    await asistenciaRepository.getAsistenciaByEmpleadoAndFecha(
      id_empleado,
      fechaHoy,
    );

  if (!existingAsistencia) {
    throw new AppError(
      "No existe un registro de entrada para el día de hoy. Debe realizar el check-in primero.",
      404,
    );
  }

  if (existingAsistencia.hora_salida) {
    throw new AppError(
      "El empleado ya registró su salida para el día de hoy",
      409,
    );
  }

  const updatedAsistencia = await asistenciaRepository.updateCheckOut({
    id: existingAsistencia.id,
    hora_salida: horaActual,
    observacion: observacion ? observacion.trim() : null,
  });

  return updatedAsistencia;
};

export const getAsistenciasService = async ({
  page = 1,
  limit = 10,
  id_empleado,
  fecha_desde,
  fecha_hasta,
  estado,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await asistenciaRepository.getAsistencias({
    limit: limitNum,
    offset,
    id_empleado,
    fecha_desde,
    fecha_hasta,
    estado,
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

export const getAsistenciaByIdService = async (id) => {
  const asistencia = await asistenciaRepository.getAsistenciaById(id);
  if (!asistencia) {
    throw new AppError("Registro de asistencia no encontrado", 404);
  }
  return asistencia;
};

export const updateAsistenciaService = async (id, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const existingAsistencia = await asistenciaRepository.getAsistenciaById(id);
  if (!existingAsistencia) {
    throw new AppError("Registro de asistencia no encontrado", 404);
  }

  const formattedData = {};

  if (updateData.fecha !== undefined) formattedData.fecha = updateData.fecha;
  if (updateData.hora_entrada !== undefined)
    formattedData.hora_entrada = updateData.hora_entrada;
  if (updateData.hora_salida !== undefined)
    formattedData.hora_salida = updateData.hora_salida;
  if (updateData.estado !== undefined) formattedData.estado = updateData.estado;
  if (updateData.observacion !== undefined) {
    formattedData.observacion = updateData.observacion
      ? updateData.observacion.trim()
      : null;
  }

  const updatedAsistencia = await asistenciaRepository.updateAsistencia(
    id,
    formattedData,
  );
  return updatedAsistencia;
};
