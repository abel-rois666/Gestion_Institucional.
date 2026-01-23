
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Profile, UserRole, DepartmentEnum, CalendarEvent, EventCategory } from '../types';
import { Pagination } from './Pagination';
import { 
  Calendar, 
  User, 
  ChevronDown, 
  Edit2,
  Eye,
  Check,
  Search,
  List,
  ArrowUpDown,
  Filter,
  Settings2,
  CheckCircle2,
  RefreshCcw,
  Clock,
  Briefcase,
  Trash2,
  ExternalLink,
  Globe
} from 'lucide-react';

interface ProcessListProps {
  tasks: Task[];
  events?: CalendarEvent[];
  eventCategories: EventCategory[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onTaskUpdate: (id: string, field: keyof Task, value: any) => void;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void; 
  onDeleteEvent?: (id: string) => void;
  currentUser: Profile;
  showDepartment?: boolean;
}

type SortKey = 'title' | 'isSpecificTask' | 'department' | 'endDate' | 'assignee_name' | 'status' | 'start_date';

interface ColumnConfig {
  id: string;
  label: string;
  isDefault: boolean;
}

const COLUMNS_SCHEMA: ColumnConfig[] = [
  { id: 'title', label: 'Nombre / Cumplimiento', isDefault: true },
  { id: 'type', label: 'Tipo', isDefault: true },
  { id: 'department', label: 'Área', isDefault: true },
  { id: 'schedule', label: 'Cronograma', isDefault: true },
  { id: 'assignee', label: 'Responsable', isDefault: false },
  { id: 'status', label: 'Estado', isDefault: true },
  { id: 'actions', label: 'Acciones', isDefault: true },
];

const StatusSelect: React.FC<{ status: TaskStatus; onChange: (s: TaskStatus) => void; compact?: boolean }> = ({ status, onChange, compact }) => {
  const bgStyles = {
    [TaskStatus.COMPLETED]: 'bg-green-50 text-green-700 border-green-200',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-200',
    [TaskStatus.PENDING]: 'bg-slate-100 text-slate-700 border-slate-200',
    [TaskStatus.OVERDUE]: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="relative inline-block w-full">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className={`appearance-none cursor-pointer font-bold border rounded-xl focus:outline-none transition-all w-full ${bgStyles[status]} ${compact ? 'text-[10px] sm:text-xs px-2 py-1.5 sm:py-1' : 'text-[11px] px-3 py-1.5 pr-8'}`}
      >
        {Object.values(TaskStatus).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
        <ChevronDown size={14} />
      </div>
    </div>
  );
};

// Componente para vista de tarjetas optimizado con TODA la información
const TaskCard: React.FC<{
  task: Task;
  onView: (t: Task) => void;
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
  currentUser: Profile;
}> = ({ task, onView, onEdit, onStatusChange, currentUser }) => {
  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(s => s.status === TaskStatus.COMPLETED).length;
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;
  const canEdit = currentUser.role !== UserRole.AUXILIAR;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 group flex flex-col h-full">
      {/* Header de Tarjeta */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5">
             <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                task.isSpecificTask ? 'bg-purple-50 text-purple-700 ring-purple-700/10' : 'bg-blue-50 text-blue-700 ring-blue-700/10'
             }`}>
                {task.isSpecificTask ? 'Tarea' : 'Proceso'}
             </span>
             <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider truncate max-w-full">
                {task.department}
             </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base leading-snug cursor-pointer group-hover:text-blue-600 transition-colors break-words" onClick={() => onView(task)}>
            {task.title}
          </h3>
        </div>
        <div className="shrink-0 w-28 sm:w-32">
          <StatusSelect status={task.status} onChange={(s) => onStatusChange(task.id, s)} compact />
        </div>
      </div>

      {/* Grid de Información Detallada */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Calendar size={12} /> Inicio</span>
          <p className="text-xs font-bold text-slate-700">{task.startDate || 'No definida'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Check size={12} /> Entrega</span>
          <p className="text-xs font-bold text-slate-700">{task.endDate || 'No definida'}</p>
        </div>
        <div className="col-span-2 pt-2 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><User size={12} /> Responsable</span>
          <p className="text-xs font-bold text-slate-700 truncate">{task.assignee_name || 'Sin asignar'}</p>
        </div>
      </div>

      {/* Barra de Progreso */}
      {subtasks.length > 0 && (
        <div className="mb-5 mt-auto">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Cumplimiento del proceso</span>
            <span className="text-[10px] font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{completedCount} de {subtasks.length} tareas terminadas</p>
        </div>
      )}

      {/* Descripción (si no hay subtareas) */}
      {subtasks.length === 0 && (
        <p className="text-sm text-slate-600 mb-5 leading-relaxed mt-auto break-words">
          {/* No line-clamp on mobile to avoid cutting text, clamp on desktop if needed */}
          {task.description || 'Sin notas o descripción técnica adicional.'}
        </p>
      )}

      {/* Acciones de Pie de Tarjeta */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
        <button onClick={() => onView(task)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all p-2 -ml-2">
          <Eye size={16} /> Ver detalles
        </button>
        {canEdit && (
          <button onClick={() => onEdit(task)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">
            <Edit2 size={14} /> Editar
          </button>
        )}
      </div>
    </div>
  );
};

export const ProcessList: React.FC<ProcessListProps> = ({ tasks, events = [], eventCategories, onStatusChange, onTaskUpdate, onEdit, onView, onDeleteEvent, currentUser, showDepartment }) => {
  const [listMode, setListMode] = useState<'TASKS' | 'EVENTS'>('TASKS');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Added State

  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterDept, setFilterDept] = useState<string>('Todos');

  const defaultColsIds = useMemo(() => new Set(COLUMNS_SCHEMA.filter(c => c.isDefault).map(c => c.id)), []);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(defaultColsIds);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, filterDept, listMode, itemsPerPage]);

  const resetToDefaultColumns = () => {
    setVisibleColumns(new Set(defaultColsIds));
  };

  const toggleColumn = (id: string) => {
    const next = new Set(visibleColumns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleColumns(next);
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const generateGCalLink = (event: CalendarEvent) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    const start = formatDate(event.start_date);
    const end = event.end_date ? formatDate(event.end_date) : new Date(new Date(event.start_date).getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const details = encodeURIComponent(event.description || '');
    const title = encodeURIComponent(event.title);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const getCategoryStyles = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    if (!cat) return 'bg-gray-50 text-gray-700 ring-gray-700/10';
    return `bg-${cat.color}-50 text-${cat.color}-700 ring-${cat.color}-700/10 ring-1 ring-inset`;
  };

  const getCategoryName = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    return cat ? cat.name : 'Evento';
  }

  // --- FILTERING & SORTING LOGIC ---
  const processedTasks = useMemo(() => {
    let result = [...tasks];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(lowerTerm) || t.department.toLowerCase().includes(lowerTerm));
    }
    if (filterStatus !== 'Todos') result = result.filter(t => t.status === filterStatus);
    if (filterType !== 'Todos') {
      const isTask = filterType === 'Tarea';
      result = result.filter(t => t.isSpecificTask === isTask);
    }
    if (filterDept !== 'Todos') result = result.filter(t => t.department === filterDept);

    if (sortConfig && listMode === 'TASKS') {
      result.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof Task] || '';
        let valB: any = b[sortConfig.key as keyof Task] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, searchTerm, sortConfig, filterStatus, filterType, filterDept, listMode]);

  const processedEvents = useMemo(() => {
      let result = [...events];
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          result = result.filter(e => e.title.toLowerCase().includes(lowerTerm));
      }
      // Sort events by date
      result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      return result;
  }, [events, searchTerm]);

  // --- PAGINATION LOGIC ---
  const currentData = listMode === 'TASKS' ? processedTasks : processedEvents;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return currentData.slice(startIndex, startIndex + itemsPerPage);
  }, [currentData, currentPage, itemsPerPage]);

  const HeaderButton: React.FC<{ label: string, sKey: SortKey }> = ({ label, sKey }) => (
    <button onClick={() => handleSort(sKey)} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group">
      {label}
      <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig?.key === sKey ? 'opacity-100 text-blue-600' : ''}`} />
    </button>
  );

  const EmptyState = () => (
    <div className="py-24 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
        <Briefcase size={32} />
      </div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No se encontraron registros activos</p>
      <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 text-xs font-bold hover:underline">Limpiar búsqueda</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Herramientas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* VIEW TOGGLE */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-center">
            <button 
                onClick={() => setListMode('TASKS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${listMode === 'TASKS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <List size={14} /> Actividades
            </button>
            <button 
                onClick={() => setListMode('EVENTS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${listMode === 'EVENTS' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Calendar size={14} /> Eventos
            </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" placeholder={listMode === 'TASKS' ? "Filtrar por nombre o área..." : "Buscar evento..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {listMode === 'TASKS' && (
            <div className="flex items-center gap-2">
            <button 
                onClick={() => { setShowFilters(!showFilters); setShowColPicker(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
            >
                <Filter size={16} /> <span className="hidden sm:inline">Filtros</span>
            </button>

            <button 
                onClick={() => { setShowColPicker(!showColPicker); setShowFilters(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showColPicker ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
            >
                <Settings2 size={16} /> <span className="hidden sm:inline">Columnas</span>
            </button>
            </div>
        )}
      </div>

      {/* Popover de Selección de Columnas (SOLO TASKS) */}
      {showColPicker && listMode === 'TASKS' && (
        <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalizar Columnas de la Tabla</h4>
            <button 
              onClick={resetToDefaultColumns}
              className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <RefreshCcw size={12} /> Restablecer predeterminados
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {COLUMNS_SCHEMA.map(col => (
              <button
                key={col.id}
                onClick={() => toggleColumn(col.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${visibleColumns.has(col.id) ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                {visibleColumns.has(col.id) ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200"></div>}
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel de Filtros Expandible (SOLO TASKS) */}
      {showFilters && listMode === 'TASKS' && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área Institucional</label>
            <select 
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="block w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas las áreas</option>
              {Object.values(DepartmentEnum).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</label>
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="block w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los estados</option>
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel Operativo</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {['Todos', 'Proceso', 'Tarea'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${filterType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => { setFilterStatus('Todos'); setFilterType('Todos'); setFilterDept('Todos'); }} className="flex-1 py-2 rounded-lg text-[10px] font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all">Limpiar filtros</button>
          </div>
        </div>
      )}

      {/* Contenedor de Vista Híbrida (Tabla/Tarjetas) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* VISTA DESKTOP (TABLA): Scroll horizontal asegurado */}
        <div className="hidden lg:block overflow-x-auto">
          {listMode === 'TASKS' ? (
            <table className="min-w-[1100px] w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                <tr>
                    {visibleColumns.has('title') && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Nombre / Cumplimiento" sKey="title" /></th>}
                    {visibleColumns.has('type') && <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Tipo" sKey="isSpecificTask" /></th>}
                    {visibleColumns.has('department') && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Área" sKey="department" /></th>}
                    {visibleColumns.has('schedule') && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Cronograma" sKey="endDate" /></th>}
                    {visibleColumns.has('assignee') && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Responsable" sKey="assignee_name" /></th>}
                    {visibleColumns.has('status') && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"><HeaderButton label="Estado" sKey="status" /></th>}
                    {visibleColumns.has('actions') && <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>}
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (paginatedData as Task[]).map(task => {
                    const completedSub = task.subtasks?.filter(s => s.status === TaskStatus.COMPLETED).length || 0;
                    const totalSub = task.subtasks?.length || 0;
                    const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                    return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                        {visibleColumns.has('title') && (
                        <td className="px-6 py-4">
                            <div className="flex flex-col text-left">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onView(task)}>{task.title}</span>
                            {totalSub > 0 && (
                                <div className="flex items-center gap-3 mt-1.5">
                                <div className="w-16 h-1 bg-slate-100 rounded-full"><div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div></div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{completedSub}/{totalSub} Completados</span>
                                </div>
                            )}
                            </div>
                        </td>
                        )}
                        {visibleColumns.has('type') && (
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${task.isSpecificTask ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-700/10' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10'}`}>
                            {task.isSpecificTask ? 'Tarea' : 'Proceso'}
                            </span>
                        </td>
                        )}
                        {visibleColumns.has('department') && <td className="px-6 py-4 whitespace-nowrap"><span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{task.department}</span></td>}
                        {visibleColumns.has('schedule') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col text-[10px] font-bold space-y-0.5">
                            <span className="text-slate-400 flex items-center gap-1"><Clock size={10} /> {task.startDate || '--'}</span>
                            <span className="text-slate-700 flex items-center gap-1"><Check size={10} /> {task.endDate || '--'}</span>
                            </div>
                        </td>
                        )}
                        {visibleColumns.has('assignee') && <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-1.5"><User size={12} className="text-slate-300"/><span className="text-[11px] font-bold text-slate-600">{task.assignee_name || 'Sin asignar'}</span></div></td>}
                        {visibleColumns.has('status') && <td className="px-6 py-4"><StatusSelect status={task.status} onChange={(s) => onStatusChange(task.id, s)} /></td>}
                        {visibleColumns.has('actions') && (
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                            <button onClick={() => onView(task)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ver detalle"><Eye size={18} /></button>
                            {currentUser.role !== UserRole.AUXILIAR && <button onClick={() => onEdit(task)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={16} /></button>}
                            </div>
                        </td>
                        )}
                    </tr>
                    );
                }) : (
                  <tr>
                    <td colSpan={visibleColumns.size + 1} className="py-24 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                )}
                </tbody>
            </table>
          ) : (
            // EVENTS TABLE
            <table className="min-w-[1100px] w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibilidad</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {paginatedData.length > 0 ? (paginatedData as CalendarEvent[]).map(event => (
                        <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-sm text-slate-900">{event.title}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-xs">{event.description}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getCategoryStyles(event.category_id)}`}>
                                    {getCategoryName(event.category_id)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col text-[11px] font-bold text-slate-700">
                                    <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                    <span className="text-slate-400 text-[10px]">{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{event.department}</span>
                            </td>
                            <td className="px-6 py-4">
                                {event.is_global ? (
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                        <Globe size={10} /> Global
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400">Interno</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <a 
                                      href={generateGCalLink(event)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                      title="Agregar a Google Calendar"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    {onDeleteEvent && (currentUser.role === UserRole.ADMIN || event.created_by === currentUser.id) && (
                                        <button 
                                            onClick={() => onDeleteEvent(event.id)} 
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Eliminar evento"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="py-24 text-center">
                                <EmptyState />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          )}
        </div>

        {/* VISTA MÓVIL/TABLET (TARJETAS) */}
        <div className="lg:hidden p-4 bg-slate-50/40">
          {listMode === 'TASKS' ? (
            paginatedData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(paginatedData as Task[]).map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onView={onView} 
                        onEdit={onEdit} 
                        onStatusChange={onStatusChange} 
                        currentUser={currentUser} 
                    />
                    ))}
                </div>
            ) : <EmptyState />
          ) : (
             paginatedData.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {(paginatedData as CalendarEvent[]).map(event => (
                         <div key={event.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-start mb-3 gap-2">
                                 <h4 className="font-bold text-slate-800 text-sm leading-snug">{event.title}</h4>
                                 <span className={`px-2 py-1 text-[9px] font-bold rounded uppercase shrink-0 ${getCategoryStyles(event.category_id)}`}>{getCategoryName(event.category_id)}</span>
                             </div>
                             <p className="text-sm text-slate-600 mb-4 leading-relaxed">{event.description}</p>
                             <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-100 pt-3">
                                 <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 <a 
                                    href={generateGCalLink(event)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                 >
                                     <Calendar size={14} /> <span>Agendar</span>
                                 </a>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : <EmptyState />
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="bg-white rounded-b-2xl">
            <Pagination 
                currentPage={currentPage}
                totalItems={currentData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />
        </div>
      </div>
    </div>
  );
};
