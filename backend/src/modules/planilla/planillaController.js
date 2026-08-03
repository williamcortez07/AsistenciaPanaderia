import * as planillaService from "./planillaService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const createPlanilla = asyncWrapper(async (req, res) => {
  const nuevaPlanilla = await planillaService.createPlanillaService(req.body);

  res.status(201).json({
    success: true,
    message: "Planilla generada exitosamente con sus detalles correspondientes",
    data: nuevaPlanilla,
  });
});

export const getPlanillas = asyncWrapper(async (req, res) => {
  const result = await planillaService.getPlanillasService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getPlanillaById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const planilla = await planillaService.getPlanillaByIdService(id);

  res.status(200).json({
    success: true,
    data: planilla,
  });
});

export const getDetallePlanilla = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await planillaService.getDetallePlanillaService(id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updatePlanillaEstado = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updatedPlanilla = await planillaService.updatePlanillaEstadoService(
    id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Estado de la planilla actualizado exitosamente",
    data: updatedPlanilla,
  });
});
