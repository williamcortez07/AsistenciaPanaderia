import * as asistenciaService from "./asistenciaService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const checkIn = asyncWrapper(async (req, res) => {
  const result = await asistenciaService.checkInService(req.body);

  res.status(201).json({
    success: true,
    message: "Entrada registrada exitosamente",
    data: result,
  });
});

export const checkOut = asyncWrapper(async (req, res) => {
  const result = await asistenciaService.checkOutService(req.body);

  res.status(200).json({
    success: true,
    message: "Salida registrada exitosamente",
    data: result,
  });
});

export const getAsistencias = asyncWrapper(async (req, res) => {
  const result = await asistenciaService.getAsistenciasService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getAsistenciaById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const asistencia = await asistenciaService.getAsistenciaByIdService(id);

  res.status(200).json({
    success: true,
    data: asistencia,
  });
});

export const updateAsistencia = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updatedAsistencia = await asistenciaService.updateAsistenciaService(
    id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Registro de asistencia actualizado exitosamente",
    data: updatedAsistencia,
  });
});
