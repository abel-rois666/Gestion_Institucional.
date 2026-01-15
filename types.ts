export enum DepartmentEnum {
  DIRECTION = 'Dirección',
  SCHOOL_CONTROL = 'Control Escolar',
  PUBLICITY = 'Publicidad',
  FINANCE = 'Finanzas',
  LINKAGE = 'Vinculación',
  ACADEMIC = 'Académico',
  HR_MATERIALS = 'Recursos Humanos y Materiales',
  TUTORING_WELLBEING = 'Tutoría y Bienestar'
}

export type Department = string;

export enum TaskStatus {
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Proceso',
  COMPLETED = 'Completado',
  OVERDUE = 'Atrasado'
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: 'PDF' | 'DRIVE' | 'LINK' | 'VIDEO' | 'IMAGE';
  category?: string; // New field for classification
}

export interface Task {
  id: string;
  department: Department;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assignee?: string; 
  isSpecificTask: boolean;
  status: TaskStatus;
  subtasks?: Task[]; 
  resources?: Resource[]; 
}

export interface KPIMetric {
  name: string;
  value: number;
  total: number;
  unit: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  timeZone: string;
  resourceCategories: string[]; // New field for configurable categories
}