import * as deduccionService from "./deduccionesService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const createDeduccion = asyncWrapper(async (req, res) => {
  const newDeduccion = await deduccionService.createDeduccionService(req.body);

  res.status(201).json({
    success: true,
    message: "Deducción creada exitosamente",
    data: newDeduccion,
  });
});

export const getDeducciones = asyncWrapper(async (req, res) => {
  const result = await deduccionService.getDeduccionesService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getDeduccionById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const deduccion = await deduccionService.getDeduccionByIdService(id);

  res.status(200).json({
    success: true,
    data: deduccion,
  });
});

export const getDeduccionByName = asyncWrapper(async (req, res) => {
  const { nombre } = req.params;
  const deduccion = await deduccionService.getDeduccionByNameService(nombre);

  res.status(200).json({
    success: true,
    data: deduccion,
  });
});

export const updateDeduccion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updatedDeduccion = await deduccionService.updateDeduccionService(
    id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Deducción actualizada exitosamente",
    data: updatedDeduccion,
  });
});
