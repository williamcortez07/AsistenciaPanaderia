import * as empleadoService from "./empleadoService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

/* ==========================================================================
   CONTROLADORES PRINCIPALES: EMPLEADOS
   ========================================================================== */

export const createEmpleado = asyncWrapper(async (req, res) => {
  const empleadoData = req.body;
  const newEmpleado = await empleadoService.createEmpleadoService(empleadoData);

  res.status(201).json({
    success: true,
    message: "Empleado creado exitosamente",
    data: newEmpleado,
  });
});

export const getEmpleados = asyncWrapper(async (req, res) => {
  const result = await empleadoService.getEmpleadosService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getEmpleadoById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const empleado = await empleadoService.getEmpleadoByIdService(id);

  res.status(200).json({
    success: true,
    data: empleado,
  });
});

export const getEmpleadoByCodigo = asyncWrapper(async (req, res) => {
  const { codigo } = req.params;
  const empleado = await empleadoService.getEmpleadoByCodigoService(codigo);

  res.status(200).json({
    success: true,
    data: empleado,
  });
});

export const updateEmpleado = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedEmpleado = await empleadoService.updateEmpleadoService(
    id,
    updateData,
  );

  res.status(200).json({
    success: true,
    message: "Empleado actualizado exitosamente",
    data: updatedEmpleado,
  });
});

/* ==========================================================================
   CONTROLADORES SUBRECURSO: EMPLEADO_DEDUCCIONES
   ========================================================================== */

export const assignDeduccion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { id_deduccion } = req.body;

  const result = await empleadoService.assignDeduccionToEmpleadoService(
    id,
    id_deduccion,
  );

  res.status(201).json({
    success: true,
    message: "Deducción asignada al empleado exitosamente",
    data: result,
  });
});

export const getEmpleadoDeducciones = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const deducciones =
    await empleadoService.getDeduccionesByEmpleadoIdService(id);

  res.status(200).json({
    success: true,
    data: deducciones,
  });
});

export const removeDeduccion = asyncWrapper(async (req, res) => {
  const { id, deduccionId } = req.params;

  const result = await empleadoService.removeDeduccionFromEmpleadoService(
    id,
    deduccionId,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
