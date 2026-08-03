import * as cargoService from "./cargoService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const createCargo = asyncWrapper(async (req, res) => {
  const cargoData = req.body;
  const newCargo = await cargoService.createCargoService(cargoData);

  res.status(201).json({
    success: true,
    message: "Cargo creado exitosamente",
    data: newCargo,
  });
});

export const getCargos = asyncWrapper(async (req, res) => {
  const result = await cargoService.getCargosService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getCargoById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const cargo = await cargoService.getCargoByIdService(id);

  res.status(200).json({
    success: true,
    data: cargo,
  });
});

export const getCargoByName = asyncWrapper(async (req, res) => {
  const { nombre } = req.params;
  const cargo = await cargoService.getCargoByNameService(nombre);

  res.status(200).json({
    success: true,
    data: cargo,
  });
});

export const updateCargo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedCargo = await cargoService.updateCargoService(id, updateData);

  res.status(200).json({
    success: true,
    message: "Cargo actualizado exitosamente",
    data: updatedCargo,
  });
});
