
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

export enum UserRole {
  ADMIN = 'admin',
  COORDINATOR = 'coordinador',
  AUXILIAR = 'auxiliar'
}

export enum TaskStatus {
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Proceso',
  COMPLETED = 'Completado',
  OVERDUE = 'Atrasado'
}

export interface ResourceCategory {
  id: string;
  name: string;
  owner_id?: string;
  is_global: boolean;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: 'PDF' | 'DRIVE' | 'LINK' | 'VIDEO' | 'IMAGE';
  category?: string;
}

export interface Report {
  id: string;
  task_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface Task {
  id: string;
  department: Department;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assignee_id?: string;
  assignee_name?: string; 
  isSpecificTask: boolean;
  status: TaskStatus;
  subtasks?: Task[]; 
  resources?: Resource[];
  reports?: Report[];
}

export interface EventCategory {
  id: string;
  name: string;
  color: string; // 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'gray'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string; // ISO String
  end_date?: string; // ISO String
  department: Department;
  category_id: string; // Referencia a EventCategory
  is_global: boolean;
  created_by?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  department: Department;
  role: UserRole;
  email: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  timeZone: string;
  resourceCategories: ResourceCategory[];
  departmentConfigs: Record<string, { enableEvents: boolean }>;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  department_restricted?: string;
  type: 'public' | 'dm';
  created_by?: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}
