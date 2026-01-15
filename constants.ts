
import { DepartmentEnum, Task, TaskStatus } from './types';

// Helper for dates in the cycle Dec 2025 - Mar 2026
const Y25 = '2025';
const Y26 = '2026';

export const MOCK_TASKS: Task[] = [
  // =========================================================================
  // CONTROL ESCOLAR
  // =========================================================================
  {
    id: 'ce-1',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Altas e ingresos',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.COMPLETED,
    subtasks: [],
    resources: []
  },
  {
    id: 'ce-2',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Reinscripciones',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'ce-3',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Solicitud, expedición y entrega de constancias',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'ce-9',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Servicio social General',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'ce-9-1',
        department: DepartmentEnum.SCHOOL_CONTROL,
        title: 'Servicio social (Art. 55)',
        startDate: `${Y25}-12-01`,
        endDate: `${Y26}-03-24`,
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'ce-13',
        department: DepartmentEnum.SCHOOL_CONTROL,
        title: 'Servicio social (Art. 52)',
        startDate: `${Y25}-12-01`,
        endDate: `${Y26}-03-24`,
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'ce-14',
        department: DepartmentEnum.SCHOOL_CONTROL,
        title: 'Servicio social (Art. 91)',
        startDate: `${Y25}-12-01`,
        endDate: `${Y26}-03-24`,
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'ce-4',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Elaboración y entrega de credenciales',
    isSpecificTask: false,
    status: TaskStatus.PENDING,
    resources: []
  },
  {
    id: 'ce-11',
    department: DepartmentEnum.SCHOOL_CONTROL,
    title: 'Elaboración de reportes y estadísticas',
    isSpecificTask: false,
    status: TaskStatus.COMPLETED,
    resources: [],
    subtasks: [
      {
        id: 'ce-12',
        department: DepartmentEnum.SCHOOL_CONTROL,
        title: 'Reportes de inspección y vigilancia',
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      }
    ]
  },

  // =========================================================================
  // PUBLICIDAD
  // =========================================================================
  {
    id: 'pub-1',
    department: DepartmentEnum.PUBLICITY,
    title: 'Captación de prospectos vía redes sociales',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'pub-2',
        department: DepartmentEnum.PUBLICITY,
        title: 'Revisión de campañas activas',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'pub-3',
        department: DepartmentEnum.PUBLICITY,
        title: 'Reporte de mensajes por día (Matutino/Vespertino)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'pub-4',
    department: DepartmentEnum.PUBLICITY,
    title: 'Captación de prospectos por medio de feria profesiográfica',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'pub-5',
        department: DepartmentEnum.PUBLICITY,
        title: 'Programación de ferias',
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      }
    ]
  },
  {
    id: 'pub-6',
    department: DepartmentEnum.PUBLICITY,
    title: 'Captación de prospectos en instituciones por medio de saloneo',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'pub-7',
        department: DepartmentEnum.PUBLICITY,
        title: 'Programación de saloneo',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'pub-8',
    department: DepartmentEnum.PUBLICITY,
    title: 'Informe presencial',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.PENDING,
    resources: [],
    subtasks: [
      {
        id: 'pub-9',
        department: DepartmentEnum.PUBLICITY,
        title: 'Reporte de informes presenciales (Matutino/Vespertino)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'pub-10',
    department: DepartmentEnum.PUBLICITY,
    title: 'Inscripción',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.COMPLETED,
    resources: [],
    subtasks: [
      {
        id: 'pub-11',
        department: DepartmentEnum.PUBLICITY,
        title: 'Reporte de cantidad de inscritos (Sábados)',
        description: '1 informe semanal los sabados',
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      }
    ]
  },
  {
    id: 'pub-12',
    department: DepartmentEnum.PUBLICITY,
    title: 'Creación de contenidos digitales',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'pub-13',
        department: DepartmentEnum.PUBLICITY,
        title: 'Presentación de cronograma',
        description: '15 días antes del inicio del mes',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'pub-15',
    department: DepartmentEnum.PUBLICITY,
    title: 'Estudio de mercado',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.PENDING,
    resources: [],
    subtasks: [
      {
        id: 'pub-16',
        department: DepartmentEnum.PUBLICITY,
        title: 'Entrega Estudio Mercado 1',
        startDate: `${Y25}-12-10`,
        endDate: `${Y25}-12-10`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'pub-17',
        department: DepartmentEnum.PUBLICITY,
        title: 'Entrega Estudio Mercado 2',
        startDate: `${Y26}-02-03`,
        endDate: `${Y26}-02-03`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },

  // =========================================================================
  // FINANZAS
  // =========================================================================
  {
    id: 'fin-1',
    department: DepartmentEnum.FINANCE,
    title: 'Registro y control de pagos diarios',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'fin-4',
    department: DepartmentEnum.FINANCE,
    title: 'Conciliaciones bancarias',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'fin-5',
        department: DepartmentEnum.FINANCE,
        title: 'Reporte Conciliaciones (Rectoría)',
        description: 'Cada viernes',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'fin-6',
    department: DepartmentEnum.FINANCE,
    title: 'Recuperación de cartera vencida',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.OVERDUE,
    resources: []
  },

  // =========================================================================
  // TUTORIA Y BIENESTAR
  // =========================================================================
  {
    id: 'tut-1',
    department: DepartmentEnum.TUTORING_WELLBEING,
    title: 'Tutorías académicas',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'tut-3',
    department: DepartmentEnum.TUTORING_WELLBEING,
    title: 'Talleres',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'tut-4',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Futbol (Miércoles 11:00)',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'tut-5',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Basquetball (Viernes 11:00)',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'tut-6',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Música (Viernes 15:00-17:00)',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'tut-7',
    department: DepartmentEnum.TUTORING_WELLBEING,
    title: 'Eventos Generales',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.COMPLETED,
    resources: [],
    subtasks: [
      {
        id: 'tut-8',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Semana de salud',
        startDate: `${Y25}-12-08`,
        endDate: `${Y25}-12-12`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'tut-9',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Semana del libro',
        startDate: `${Y26}-01-12`,
        endDate: `${Y26}-01-19`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'tut-11',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Posada navideña',
        startDate: `${Y25}-12-01`,
        endDate: `${Y25}-12-05`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'tut-12',
        department: DepartmentEnum.TUTORING_WELLBEING,
        title: 'Evento del 14 de febrero',
        startDate: `${Y26}-02-13`,
        endDate: `${Y26}-02-13`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },

  // =========================================================================
  // VINCULACIÓN
  // =========================================================================
  {
    id: 'vin-1',
    department: DepartmentEnum.LINKAGE,
    title: 'Seguimiento a egresados',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'vin-2',
    department: DepartmentEnum.LINKAGE,
    title: 'Gestión de convenios',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },

  // =========================================================================
  // ACADÉMICO
  // =========================================================================
  {
    id: 'aca-0',
    department: DepartmentEnum.ACADEMIC,
    title: 'Asignación de materias',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-1',
        department: DepartmentEnum.ACADEMIC,
        title: 'Definir materias y compartir horarios (Semestre)',
        startDate: `${Y26}-01-12`,
        endDate: `${Y26}-01-12`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-2',
        department: DepartmentEnum.ACADEMIC,
        title: 'Entrega y devolución de disponibilidades (Semestre)',
        startDate: `${Y26}-01-13`,
        endDate: `${Y26}-01-20`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-3',
        department: DepartmentEnum.ACADEMIC,
        title: 'Realización de horarios (Semestre)',
        startDate: `${Y26}-02-16`,
        endDate: `${Y26}-02-21`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-4',
        department: DepartmentEnum.ACADEMIC,
        title: 'Confirmación de carga horaria (Semestre)',
        startDate: `${Y26}-02-23`,
        endDate: `${Y26}-02-27`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-5',
        department: DepartmentEnum.ACADEMIC,
        title: 'Definir materias y compartir horarios (Cuatrimestre)',
        startDate: `${Y26}-01-07`,
        endDate: `${Y26}-01-07`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-6',
        department: DepartmentEnum.ACADEMIC,
        title: 'Entrega y devolución de disponibilidades (Cuatrimestre)',
        startDate: `${Y26}-01-08`,
        endDate: `${Y26}-01-15`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-7',
        department: DepartmentEnum.ACADEMIC,
        title: 'Realización de horarios (Cuatrimestre)',
        startDate: `${Y26}-01-19`,
        endDate: `${Y26}-01-26`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-8',
        department: DepartmentEnum.ACADEMIC,
        title: 'Confirmación de carga horaria (Cuatrimestre)',
        startDate: `${Y26}-01-27`,
        endDate: `${Y26}-01-30`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      }
    ]
  },
  {
    id: 'aca-9',
    department: DepartmentEnum.ACADEMIC,
    title: 'Contratación docente de nuevo ingreso',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-10',
        department: DepartmentEnum.ACADEMIC,
        title: 'Definir y publicar vacantes (Cuatrimestre)',
        startDate: `${Y26}-01-15`,
        endDate: `${Y26}-01-15`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-11',
        department: DepartmentEnum.ACADEMIC,
        title: 'Citar y seleccionar prospecto (Cuatrimestre)',
        startDate: `${Y26}-01-16`,
        endDate: `${Y26}-01-24`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-12',
        department: DepartmentEnum.ACADEMIC,
        title: 'Planificación citas contratación (Cuatrimestre)',
        startDate: `${Y26}-02-02`,
        endDate: `${Y26}-02-07`,
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'aca-13',
        department: DepartmentEnum.ACADEMIC,
        title: 'Definir y publicar vacantes (Semestre)',
        startDate: `${Y26}-02-21`,
        endDate: `${Y26}-02-21`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-14',
        department: DepartmentEnum.ACADEMIC,
        title: 'Citar y seleccionar prospectos (Semestre)',
        startDate: `${Y26}-02-23`,
        endDate: `${Y26}-02-27`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-15',
        department: DepartmentEnum.ACADEMIC,
        title: 'Planificación citas contratación (Semestre)',
        startDate: `${Y26}-03-02`,
        endDate: `${Y26}-03-07`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'aca-16',
    department: DepartmentEnum.ACADEMIC,
    title: 'Recontratación docente',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-17',
        department: DepartmentEnum.ACADEMIC,
        title: 'Recontratación Citas (Cuatrimestre)',
        startDate: `${Y26}-02-02`,
        endDate: `${Y26}-02-07`,
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'aca-18',
        department: DepartmentEnum.ACADEMIC,
        title: 'Recontratación Citas (Semestre)',
        startDate: `${Y26}-03-02`,
        endDate: `${Y26}-03-07`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'aca-19',
    department: DepartmentEnum.ACADEMIC,
    title: 'Expediente de asignatura',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-20',
        department: DepartmentEnum.ACADEMIC,
        title: 'Planeación docente (1 sem. después inicio clases)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-21',
        department: DepartmentEnum.ACADEMIC,
        title: 'Políticas de clase y Criterios de Evaluación',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-22',
        department: DepartmentEnum.ACADEMIC,
        title: 'Control aprovechamiento y asistencia (Fin parcial)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'aca-23',
    department: DepartmentEnum.ACADEMIC,
    title: 'Programación de exámenes y calificaciones',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-24',
        department: DepartmentEnum.ACADEMIC,
        title: 'Calendario de exámenes (1ra semana)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-25',
        department: DepartmentEnum.ACADEMIC,
        title: 'Captura calificaciones (Final parcial + 1 sem)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'aca-27',
    department: DepartmentEnum.ACADEMIC,
    title: 'Evaluación docente',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-28',
        department: DepartmentEnum.ACADEMIC,
        title: 'Periodo Evaluación Docente (2do parcial - Final)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'aca-29',
        department: DepartmentEnum.ACADEMIC,
        title: 'Análisis y reporte Evaluación Docente (1 sem. post)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'aca-30',
    department: DepartmentEnum.ACADEMIC,
    title: 'Nómina docente',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-31',
        department: DepartmentEnum.ACADEMIC,
        title: 'Reporte de incidencias (16 y 1 de cada mes)',
        description: 'Envío a RH, Finanzas y Dirección',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'aca-Prope',
    department: DepartmentEnum.ACADEMIC,
    title: 'Propedéutico',
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'aca-36',
        department: DepartmentEnum.ACADEMIC,
        title: 'Propedéutico (Cuatrimestre)',
        description: '22 y 29 Ene / 05 y 12 Feb (linea), 14 Feb (presencial)',
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'aca-37',
        department: DepartmentEnum.ACADEMIC,
        title: 'Propedéutico (Semestre)',
        description: '26 Feb / 05, 12, 19 Mar (linea), 21 Mar (presencial)',
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },

  // =========================================================================
  // RECURSOS HUMANOS Y MATERIALES
  // =========================================================================
  {
    id: 'hr-1',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Nómina de personal administrativo',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-2',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte de incidencias (10 y 25)',
        description: 'Envío a contabilidad y dirección',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'hr-5',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Capacitación de personal',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-6',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Curso NOM-026',
        startDate: `${Y25}-12-05`,
        endDate: `${Y25}-12-05`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'hr-7',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Curso NOM 019',
        startDate: `${Y26}-01-23`,
        endDate: `${Y26}-01-23`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'hr-8',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Curso Trabajo en Equipo',
        startDate: `${Y26}-02-27`,
        endDate: `${Y26}-02-27`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'hr-9',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Curso NOM 002',
        startDate: `${Y26}-03-27`,
        endDate: `${Y26}-03-27`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'hr-11',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Vacaciones',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-12',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte vacacional (Carlos, Maya, Berenice)',
        startDate: `${Y25}-12-25`,
        endDate: `${Y25}-12-25`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'hr-13',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte vacacional (Angelica)',
        startDate: `${Y26}-01-25`,
        endDate: `${Y26}-01-25`,
        isSpecificTask: true,
        status: TaskStatus.COMPLETED,
        resources: []
      },
      {
        id: 'hr-14',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte vacacional (Sotelo, Cristian)',
        startDate: `${Y26}-02-25`,
        endDate: `${Y26}-02-25`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      },
      {
        id: 'hr-15',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte vacacional (Silvana, Judith, Arturo, Joshua)',
        startDate: `${Y26}-03-25`,
        endDate: `${Y26}-03-25`,
        isSpecificTask: true,
        status: TaskStatus.PENDING,
        resources: []
      }
    ]
  },
  {
    id: 'hr-16',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Retardos y faltas',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-17',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Seguimiento diario de retardos y faltas',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'hr-19',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Supervisión y mantenimiento de instalaciones',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-20',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Recorrido de instalaciones',
        description: 'Día 11 de cada mes',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      },
      {
        id: 'hr-21',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Reporte de incidencias instalaciones',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'hr-22',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Limpieza general',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: [],
    subtasks: [
      {
        id: 'hr-23',
        department: DepartmentEnum.HR_MATERIALS,
        title: 'Limpieza oficinas, salones, áreas comunes (Bitácora)',
        // Fix: Renamed 'assignee' to 'assignee_name'
        assignee_name: 'Joshua',
        isSpecificTask: true,
        status: TaskStatus.IN_PROGRESS,
        resources: []
      }
    ]
  },
  {
    id: 'hr-24',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Mantenimiento de equipos',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.IN_PROGRESS,
    resources: []
  },
  {
    id: 'hr-25',
    department: DepartmentEnum.HR_MATERIALS,
    title: 'Equipamiento y asignación herramientas nuevo ingreso',
    startDate: `${Y25}-12-01`,
    endDate: `${Y26}-03-24`,
    isSpecificTask: false,
    status: TaskStatus.PENDING,
    resources: []
  }
];
