import * as vacacionService from "./vacacionesService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const createVacacion = asyncWrapper(async (req, res) => {
  const newVacacion = await vacacionService.createVacacionService(req.body);

  res.status(201).json({
    success: true,
    message: "Solicitud de vacaciones creada exitosamente",
    data: newVacacion,
  });
});

export const getVacaciones = asyncWrapper(async (req, res) => {
  const result = await vacacionService.getVacacionesService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getVacacionById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const vacacion = await vacacionService.getVacacionByIdService(id);

  res.status(200).json({
    success: true,
    data: vacacion,
  });
});

export const updateVacacion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updatedVacacion = await vacacionService.updateVacacionService(
    id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Registro de vacaciones actualizado exitosamente",
    data: updatedVacacion,
  });
});
