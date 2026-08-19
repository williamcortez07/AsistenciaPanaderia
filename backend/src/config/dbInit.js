import { query } from "./db.js";
import { logger } from "../utils/logger.js";

export const initializeEvaluacionesTables = async () => {
  try {
    logger.info("Verificando e inicializando tablas para el módulo de Evaluaciones...");

    // 1. Agregar id_supervisor a empleados si no existe
    await query(`
      ALTER TABLE public.empleados 
      ADD COLUMN IF NOT EXISTS id_supervisor UUID REFERENCES public.empleados(id) ON DELETE SET NULL;
    `);

    // 2. Tabla de periodos_evaluacion
    await query(`
      CREATE TABLE IF NOT EXISTS public.periodos_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(150) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        duracion_meses INT DEFAULT 6,
        estado VARCHAR(30) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado', 'cancelado')),
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Tabla de criterios_evaluacion (Catálogo base)
    await query(`
      CREATE TABLE IF NOT EXISTS public.criterios_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(150) NOT NULL UNIQUE,
        descripcion TEXT,
        orden INT DEFAULT 1,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Tabla de criterios_periodo_evaluacion (Ponderaciones por periodo)
    await query(`
      CREATE TABLE IF NOT EXISTS public.criterios_periodo_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_periodo UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
        id_criterio UUID NOT NULL REFERENCES public.criterios_evaluacion(id) ON DELETE RESTRICT,
        ponderacion NUMERIC(5,2) NOT NULL CHECK (ponderacion >= 0 AND ponderacion <= 100),
        puntuacion_maxima NUMERIC(5,2) DEFAULT 100,
        orden INT DEFAULT 1,
        UNIQUE(id_periodo, id_criterio)
      );
    `);

    // 5. Tabla de preguntas_evaluacion (Checklist de preguntas por criterio)
    await query(`
      CREATE TABLE IF NOT EXISTS public.preguntas_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_criterio UUID NOT NULL REFERENCES public.criterios_evaluacion(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        tipo_respuesta VARCHAR(50) DEFAULT 'escala_1_5',
        puntuacion_maxima INT DEFAULT 5,
        orden INT DEFAULT 1,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Tabla de evaluaciones_desempeno
    await query(`
      CREATE TABLE IF NOT EXISTS public.evaluaciones_desempeno (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_empleado UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
        id_periodo UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
        id_evaluador UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
        fecha_evaluacion TIMESTAMP DEFAULT NOW(),
        estado VARCHAR(30) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_proceso', 'completada', 'aprobada', 'cancelada')),
        puntuacion_total NUMERIC(5,2) DEFAULT 0.00,
        observaciones TEXT,
        fortalezas TEXT,
        areas_oportunidad TEXT,
        comentarios_empleado TEXT,
        fecha_cierre TIMESTAMP,
        creado_por UUID REFERENCES public.usuarios(id),
        modificado_por UUID REFERENCES public.usuarios(id),
        fecha_modificacion TIMESTAMP DEFAULT NOW(),
        UNIQUE(id_empleado, id_periodo)
      );
    `);

    // 7. Asegurar columnas adicionales en evaluaciones_desempeno si la tabla ya existía
    await query(`
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS fortalezas TEXT;
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS areas_oportunidad TEXT;
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS comentarios_empleado TEXT;
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES public.usuarios(id);
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS modificado_por UUID REFERENCES public.usuarios(id);
      ALTER TABLE public.evaluaciones_desempeno ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMP DEFAULT NOW();
    `);

    // 8. Tabla de respuestas_evaluacion (Respuestas detalladas a cada pregunta)
    await query(`
      CREATE TABLE IF NOT EXISTS public.respuestas_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_evaluacion UUID NOT NULL REFERENCES public.evaluaciones_desempeno(id) ON DELETE CASCADE,
        id_pregunta UUID REFERENCES public.preguntas_evaluacion(id) ON DELETE SET NULL,
        id_criterio_periodo UUID REFERENCES public.criterios_periodo_evaluacion(id) ON DELETE CASCADE,
        puntuacion INT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
        comentario TEXT,
        UNIQUE(id_evaluacion, id_pregunta)
      );
    `);

    // 9. Tabla de resultados_evaluacion (Resumen por criterio ponderado)
    await query(`
      CREATE TABLE IF NOT EXISTS public.resultados_evaluacion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_evaluacion UUID NOT NULL REFERENCES public.evaluaciones_desempeno(id) ON DELETE CASCADE,
        id_criterio_periodo UUID NOT NULL REFERENCES public.criterios_periodo_evaluacion(id) ON DELETE CASCADE,
        puntuacion NUMERIC(5,2) NOT NULL,
        comentario TEXT,
        cumplido BOOLEAN,
        UNIQUE(id_evaluacion, id_criterio_periodo)
      );
    `);

    // 10. Tabla de objetivos_empleado
    await query(`
      CREATE TABLE IF NOT EXISTS public.objetivos_empleado (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_empleado UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
        id_periodo UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        meta NUMERIC(10,2),
        resultado NUMERIC(10,2),
        porcentaje_cumplimiento NUMERIC(5,2),
        estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'cumplido', 'no_cumplido')),
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // 11. Tabla de planes_mejora
    await query(`
      CREATE TABLE IF NOT EXISTS public.planes_mejora (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_evaluacion UUID REFERENCES public.evaluaciones_desempeno(id) ON DELETE SET NULL,
        id_empleado UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
        id_criterio UUID REFERENCES public.criterios_evaluacion(id) ON DELETE SET NULL,
        problema_detectado TEXT NOT NULL,
        objetivo_mejora TEXT NOT NULL,
        acciones_propuestas TEXT NOT NULL,
        responsable VARCHAR(150),
        fecha_inicio DATE,
        fecha_limite DATE,
        porcentaje_avance NUMERIC(5,2) DEFAULT 0.00,
        estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado')),
        observaciones TEXT,
        resultado_final TEXT,
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);

    // 12. Sembrar Catálogo Inicial de 14 Criterios
    const criteriosIniciales = [
      { nombre: "Rendimiento", descripcion: "Desempeño y eficiencia en las labores cotidianas del puesto.", orden: 1 },
      { nombre: "Objetivos", descripcion: "Cumplimiento de metas y resultados asignados para el periodo.", orden: 2 },
      { nombre: "Responsabilidad", descripcion: "Puntualidad, asistencia, compromiso y cumplimiento de deberes.", orden: 3 },
      { nombre: "Competencias en el trabajo", descripcion: "Habilidades técnicas y operativas aplicadas en sus funciones.", orden: 4 },
      { nombre: "Aptitudes", descripcion: "Capacidad de adaptación, aprendizaje y destreza profesional.", orden: 5 },
      { nombre: "Colaboración", descripcion: "Disposición para brindar apoyo mutuo y trabajo cooperativo.", orden: 6 },
      { nombre: "Trabajo en equipo", descripcion: "Coordinación, respeto y relacionamiento con sus compañeros.", orden: 7 },
      { nombre: "Seguimiento de órdenes", descripcion: "Atención, escucha activa y alineación con las instrucciones.", orden: 8 },
      { nombre: "Cumplimiento de órdenes", descripcion: "Ejecución oportuna y fiel de las tareas encomendadas.", orden: 9 },
      { nombre: "Conocimientos", descripcion: "Dominio técnico y teórico de los procesos de la empresa.", orden: 10 },
      { nombre: "Iniciativa propia", descripcion: "Proactividad e independencia sin requerir supervisión constante.", orden: 11 },
      { nombre: "Creatividad", descripcion: "Capacidad para proponer soluciones novedosas ante eventualidades.", orden: 12 },
      { nombre: "Ideas creativas", descripcion: "Aporte de sugerencias prácticas para mejorar la productividad.", orden: 13 },
      { nombre: "Interés y compromiso con la empresa", descripcion: "Identificación y lealtad con los valores organizacionales.", orden: 14 }
    ];

    for (const c of criteriosIniciales) {
      await query(`
        INSERT INTO public.criterios_evaluacion (nombre, descripcion, orden, activo)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (nombre) DO UPDATE SET 
          descripcion = EXCLUDED.descripcion,
          orden = EXCLUDED.orden;
      `, [c.nombre, c.descripcion, c.orden]);
    }

    // 13. Sembrar Checklist Inicial de 37 Preguntas
    const preguntasSeed = [
      // A. Colaboración y trabajo en equipo (Criterios: Colaboración / Trabajo en equipo)
      { criterio: "Trabajo en equipo", orden: 1, texto: "¿Trabaja adecuadamente en equipo?" },
      { criterio: "Trabajo en equipo", orden: 2, texto: "¿Se coordina correctamente con los demás miembros del equipo?" },
      { criterio: "Trabajo en equipo", orden: 3, texto: "¿Mantiene una comunicación efectiva con sus compañeros?" },
      { criterio: "Colaboración", orden: 4, texto: "¿Está dispuesto a apoyar a otros compañeros cuando lo necesitan?" },
      { criterio: "Colaboración", orden: 5, texto: "¿Comparte información relevante con el equipo?" },
      { criterio: "Trabajo en equipo", orden: 6, texto: "¿Respeta las opiniones y aportes de sus compañeros?" },
      { criterio: "Colaboración", orden: 7, texto: "¿Contribuye positivamente al ambiente laboral?" },

      // B. Seguimiento y cumplimiento de órdenes
      { criterio: "Seguimiento de órdenes", orden: 8, texto: "¿Comprende correctamente las instrucciones recibidas?" },
      { criterio: "Seguimiento de órdenes", orden: 9, texto: "¿Da seguimiento a las órdenes asignadas?" },
      { criterio: "Cumplimiento de órdenes", orden: 10, texto: "¿Cumple las instrucciones dentro del tiempo establecido?" },
      { criterio: "Seguimiento de órdenes", orden: 11, texto: "¿Solicita aclaraciones cuando una instrucción no es suficientemente clara?" },
      { criterio: "Cumplimiento de órdenes", orden: 12, texto: "¿Informa oportunamente cuando no puede cumplir una orden?" },
      { criterio: "Cumplimiento de órdenes", orden: 13, texto: "¿Ejecuta las tareas de acuerdo con los procedimientos establecidos?" },
      { criterio: "Seguimiento de órdenes", orden: 14, texto: "¿Da seguimiento hasta completar las tareas asignadas?" },

      // C. Responsabilidad y rendimiento
      { criterio: "Responsabilidad", orden: 15, texto: "¿Cumple con las responsabilidades propias de su cargo?" },
      { criterio: "Responsabilidad", orden: 16, texto: "¿Entrega sus tareas dentro de los plazos establecidos?" },
      { criterio: "Rendimiento", orden: 17, texto: "¿Mantiene la calidad esperada en su trabajo?" },
      { criterio: "Responsabilidad", orden: 18, texto: "¿Demuestra compromiso con las actividades asignadas?" },
      { criterio: "Responsabilidad", orden: 19, texto: "¿Utiliza adecuadamente los recursos proporcionados por la empresa?" },
      { criterio: "Rendimiento", orden: 20, texto: "¿Asume responsabilidad por los resultados de su trabajo?" },

      // D. Conocimientos y competencias
      { criterio: "Conocimientos", orden: 21, texto: "¿Demuestra conocimientos suficientes para desempeñar su cargo?" },
      { criterio: "Competencias en el trabajo", orden: 22, texto: "¿Aplica correctamente sus conocimientos en situaciones reales?" },
      { criterio: "Conocimientos", orden: 23, texto: "¿Busca actualizar sus conocimientos profesionales?" },
      { criterio: "Competencias en el trabajo", orden: 24, texto: "¿Comprende los procedimientos relacionados con sus funciones?" },
      { criterio: "Aptitudes", orden: 25, texto: "¿Resuelve problemas relacionados con sus responsabilidades?" },
      { criterio: "Aptitudes", orden: 26, texto: "¿Aprende rápidamente nuevos procedimientos o herramientas?" },

      // E. Iniciativa, creatividad y mejora
      { criterio: "Iniciativa propia", orden: 27, texto: "¿Propone soluciones ante los problemas que identifica?" },
      { criterio: "Iniciativa propia", orden: 28, texto: "¿Demuestra iniciativa sin requerir supervisión constante?" },
      { criterio: "Ideas creativas", orden: 29, texto: "¿Propone ideas para mejorar los procesos?" },
      { criterio: "Creatividad", orden: 30, texto: "¿Busca nuevas formas de realizar eficientemente sus tareas?" },
      { criterio: "Creatividad", orden: 31, texto: "¿Demuestra creatividad para resolver situaciones laborales?" },
      { criterio: "Ideas creativas", orden: 32, texto: "¿Presenta ideas que pueden beneficiar a la empresa?" },
      { criterio: "Iniciativa propia", orden: 33, texto: "¿Participa activamente en iniciativas de mejora continua?" },

      // F. Compromiso con la empresa
      { criterio: "Interés y compromiso con la empresa", orden: 34, texto: "¿Demuestra compromiso con los objetivos de la organización?" },
      { criterio: "Interés y compromiso con la empresa", orden: 35, texto: "¿Actúa de acuerdo con los intereses y valores de la empresa?" },
      { criterio: "Interés y compromiso con la empresa", orden: 36, texto: "¿Cuida la imagen y los recursos de la organización?" },
      { criterio: "Interés y compromiso con la empresa", orden: 37, texto: "¿Demuestra disposición para contribuir al logro de los objetivos empresariales?" }
    ];

    for (const p of preguntasSeed) {
      // Buscar id_criterio por nombre
      const critRes = await query(`SELECT id FROM public.criterios_evaluacion WHERE nombre = $1`, [p.criterio]);
      if (critRes.rows.length > 0) {
        const id_criterio = critRes.rows[0].id;
        const exists = await query(`SELECT id FROM public.preguntas_evaluacion WHERE texto = $1`, [p.texto]);
        if (exists.rows.length === 0) {
          await query(`
            INSERT INTO public.preguntas_evaluacion (id_criterio, texto, tipo_respuesta, puntuacion_maxima, orden, activo)
            VALUES ($1, $2, 'escala_1_5', 5, $3, true);
          `, [id_criterio, p.texto, p.orden]);
        }
      }
    }

    logger.info("Tablas y semillas del módulo de Evaluaciones inicializadas exitosamente.");
  } catch (error) {
    logger.error({ error }, "Error inicializando tablas de evaluaciones");
  }
};
