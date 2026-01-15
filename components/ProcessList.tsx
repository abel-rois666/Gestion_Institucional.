import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronRight, 
  CornerDownRight, 
  Building2, 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Filter,
  X,
  Eye,
  SlidersHorizontal,
  Check,
  MoreVertical
} from 'lucide-react';

interface ProcessListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onTaskUpdate: (id: string, field: keyof Task, value: any) => void;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void; 
}

type SortKey = 'title' | 'startDate' | 'department' | 'assignee' | 'status' | 'isSpecificTask';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

interface FilterConfig {
  status: TaskStatus | 'ALL';
  type: 'ALL' | 'GENERAL' | 'SPECIFIC';
  assignee: string | 'ALL';
}

// Configuration for Visible Columns
interface ColumnVisibility {
  startDate: boolean;
  department: boolean;
  assignee: boolean;
  status: boolean;
  type: boolean;
}

const StatusSelect: React.FC<{ status: TaskStatus; onChange: (s: TaskStatus) => void; compact?: boolean }> = ({ status, onChange, compact }) => {
  const bgStyles = {
    [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
    [TaskStatus.PENDING]: 'bg-gray-100 text-gray-800 border-gray-200',
    [TaskStatus.OVERDUE]: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="relative inline-block w-full">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className={`appearance-none cursor-pointer font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 w-full ${bgStyles[status]} ${compact ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1 pr-6'}`}
      >
        {Object.values(TaskStatus).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {!compact && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-current opacity-60">
          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      )}
    </div>
  );
};

// --- Inline Editable Cell Component ---
interface EditableCellProps {
  value: string | undefined;
  type?: 'text' | 'date';
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  type = 'text', 
  onSave, 
  placeholder = '-', 
  className = '',
  inputClassName = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');

  // Update tempValue if prop changes externally (unless editing)
  useEffect(() => {
    if (!isEditing) setTempValue(value || '');
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== (value || '')) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Triggers handleBlur
    } else if (e.key === 'Escape') {
      setTempValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type={type}
        autoFocus
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border border-blue-400 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-200 text-sm ${inputClassName}`}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className={`cursor-text hover:bg-gray-100 rounded px-1.5 py-0.5 border border-transparent hover:border-gray-200 transition-colors truncate ${!value ? 'text-gray-400 italic' : ''} ${className}`}
      title={value || placeholder}
    >
      {value || placeholder}
    </div>
  );
};

// --- MOBILE/TABLET CARD COMPONENT ---
const MobileTaskCard: React.FC<{
  task: Task;
  depth?: number;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onTaskUpdate: (id: string, field: keyof Task, value: any) => void;
  onEdit: (t: Task) => void;
  onView: (t: Task) => void;
  visibility: ColumnVisibility;
}> = ({ task, depth = 0, onStatusChange, onTaskUpdate, onEdit, onView, visibility }) => {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default on mobile to save space
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const borderColors = {
    [TaskStatus.COMPLETED]: 'border-l-green-500',
    [TaskStatus.IN_PROGRESS]: 'border-l-blue-500',
    [TaskStatus.PENDING]: 'border-l-gray-400',
    [TaskStatus.OVERDUE]: 'border-l-red-500',
  };

  return (
    <div className={`transition-all w-full ${depth > 0 ? 'ml-4' : ''}`}>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${borderColors[task.status]} overflow-hidden`}>
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center space-x-2 mb-1">
              {depth > 0 && <CornerDownRight size={12} className="text-gray-400" />}
              {visibility.type && (
                 <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.isSpecificTask ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {task.isSpecificTask ? 'Tarea' : 'Proceso'}
                 </span>
              )}
               {visibility.status && (
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  {task.status}
                </span>
              )}
            </div>
            
            <button 
              onClick={() => onView(task)}
              className="text-left font-semibold text-gray-900 text-base leading-tight hover:text-blue-600 transition-colors w-full"
            >
              {task.title}
            </button>
            <div className="mt-1">
               <EditableCell 
                value={task.description} 
                onSave={(val) => onTaskUpdate(task.id, 'description', val)}
                placeholder="Sin descripción"
                className="text-xs text-gray-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {hasSubtasks && (
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 p-1">
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Card Body - Grid Layout (2 cols for both mobile and tablet inside card) */}
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          {visibility.department && (
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Área / Programa</label>
              <div className="font-medium text-gray-800">{task.department}</div>
            </div>
          )}

          {visibility.assignee && (
            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Responsable</label>
              <EditableCell 
                value={task.assignee}
                onSave={(val) => onTaskUpdate(task.id, 'assignee', val)}
                placeholder="Sin Asignar"
                className="font-medium text-gray-800"
              />
            </div>
          )}

          {visibility.startDate && (
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Fecha Inicio</label>
              <EditableCell 
                type="date" 
                value={task.startDate} 
                onSave={(val) => onTaskUpdate(task.id, 'startDate', val)}
                placeholder="--"
                className="text-gray-700"
              />
            </div>
          )}

          {visibility.startDate && (
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Últ. Actividad / Fin</label>
              <EditableCell 
                type="date" 
                value={task.endDate} 
                onSave={(val) => onTaskUpdate(task.id, 'endDate', val)}
                placeholder="--"
                className="text-gray-700"
              />
            </div>
          )}

          {visibility.status && (
             <div className="col-span-2 md:col-span-2 mt-1 flex items-end">
                 <StatusSelect 
                  status={task.status} 
                  onChange={(s) => onStatusChange(task.id, s)}
                  compact={false} 
                 />
             </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex space-x-2">
               <button 
                onClick={() => onView(task)}
                className="p-2 rounded bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors"
                title="Ver Detalles"
               >
                 <Eye size={18} />
               </button>
               <button 
                 onClick={() => onEdit(task)}
                 className="p-2 rounded bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                 title="Editar"
               >
                 <Edit2 size={18} />
               </button>
            </div>
            
            <button 
              onClick={() => onEdit(task)}
              className="px-4 py-1.5 bg-gray-800 text-white text-xs font-medium rounded hover:bg-gray-700 transition"
            >
              Editar
            </button>
        </div>
      </div>

      {/* Subtasks */}
      {isOpen && hasSubtasks && (
        <div className="mt-2 border-l-2 border-gray-200 pl-2 space-y-3">
          {task.subtasks?.map(sub => (
            <MobileTaskCard 
              key={sub.id} 
              task={sub} 
              depth={depth + 1}
              onStatusChange={onStatusChange}
              onTaskUpdate={onTaskUpdate}
              onEdit={onEdit}
              onView={onView}
              visibility={visibility}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- DESKTOP ROW COMPONENT ---
const TaskRow: React.FC<{ 
  task: Task; 
  depth?: number; 
  onStatusChange: (id: string, s: TaskStatus) => void;
  onTaskUpdate: (id: string, field: keyof Task, value: any) => void;
  onEdit: (t: Task) => void;
  onView: (t: Task) => void;
  sortConfig: SortConfig;
  visibility: ColumnVisibility;
}> = ({ task, depth = 0, onStatusChange, onTaskUpdate, onEdit, onView, sortConfig, visibility }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Sort subtasks if they exist
  const sortedSubtasks = useMemo(() => {
    if (!task.subtasks) return [];
    // Basic sorting for subtasks based on same config
    return [...task.subtasks].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [task.subtasks, sortConfig]);

  const hasSubtasks = sortedSubtasks.length > 0;
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors group ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex items-start">
             {/* Indentation for subtasks */}
            {depth > 0 && (
              <div className="mr-3 mt-1 flex-shrink-0 text-gray-400" style={{ marginLeft: `${(depth - 1) * 20}px` }}>
                <CornerDownRight size={16} />
              </div>
            )}
            
            {/* Expand/Collapse Toggle */}
            {hasSubtasks ? (
               <button 
                onClick={toggleOpen} 
                className="mr-2 mt-1 text-gray-500 hover:text-blue-600 focus:outline-none"
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
               /* Spacer */
               hasSubtasks && <div className="w-4 mr-2" />
            )}

            <div className="flex-1 min-w-0">
              {/* Clickable Title (View Details) */}
              <div className={`text-sm ${depth === 0 ? 'font-semibold' : 'font-medium'}`}>
                <button 
                  onClick={() => onView(task)}
                  className={`text-left hover:text-blue-600 hover:underline transition-colors focus:outline-none ${depth === 0 ? 'text-gray-900' : 'text-gray-700'}`}
                  title="Ver detalles"
                >
                  {task.title}
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                <EditableCell 
                  value={task.description} 
                  onSave={(val) => onTaskUpdate(task.id, 'description', val)}
                  placeholder="Agregar descripción..."
                  className="-ml-1.5"
                  inputClassName="text-xs"
                />
              </div>
            </div>
          </div>
        </td>
        
        {visibility.startDate && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col text-sm text-gray-500 space-y-1">
              <div className="flex items-center">
                <span className="text-xs w-8 text-gray-400">Inicio:</span>
                <EditableCell 
                  type="date" 
                  value={task.startDate} 
                  onSave={(val) => onTaskUpdate(task.id, 'startDate', val)}
                  className="ml-1"
                  placeholder="Definir"
                />
              </div>
              <div className="flex items-center">
                <span className="text-xs w-8 text-gray-400">Fin:</span>
                <EditableCell 
                  type="date" 
                  value={task.endDate} 
                  onSave={(val) => onTaskUpdate(task.id, 'endDate', val)}
                  className="ml-1"
                  placeholder="Definir"
                />
              </div>
            </div>
          </td>
        )}

        {visibility.department && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate max-w-[150px]" title={task.department}>
                {task.department}
              </span>
            </div>
          </td>
        )}

        {visibility.assignee && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-700">
              <User className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
              <div className="min-w-[100px]">
                <EditableCell 
                  value={task.assignee}
                  onSave={(val) => onTaskUpdate(task.id, 'assignee', val)}
                  placeholder="Asignar"
                />
              </div>
            </div>
          </td>
        )}

        {visibility.type && (
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 text-xs rounded ${task.isSpecificTask ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
              {task.isSpecificTask ? 'Tarea Específica' : 'Proceso General'}
            </span>
          </td>
        )}

        {visibility.status && (
          <td className="px-6 py-4 whitespace-nowrap">
            <StatusSelect 
              status={task.status} 
              onChange={(s) => onStatusChange(task.id, s)} 
            />
          </td>
        )}

        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="flex items-center justify-end space-x-1">
            <button 
              onClick={() => onView(task)}
              className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-50"
              title="Ver Detalles"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={() => onEdit(task)}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </td>
      </tr>
      
      {/* Recursive rendering of subtasks */}
      {isOpen && sortedSubtasks.map(subtask => (
        <TaskRow 
          key={subtask.id} 
          task={subtask} 
          depth={depth + 1} 
          onStatusChange={onStatusChange}
          onTaskUpdate={onTaskUpdate}
          onEdit={onEdit}
          onView={onView}
          sortConfig={sortConfig}
          visibility={visibility}
        />
      ))}
    </>
  );
};

export const ProcessList: React.FC<ProcessListProps> = ({ tasks, onStatusChange, onTaskUpdate, onEdit, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  
  // Visibility State
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [visibility, setVisibility] = useState<ColumnVisibility>({
    startDate: true,
    department: true,
    assignee: true,
    status: true,
    type: true
  });
  const visibilityRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({ status: 'ALL', type: 'ALL', assignee: 'ALL' });
  const filterRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    const traverse = (list: Task[]) => {
      list.forEach(t => {
        if (t.assignee) set.add(t.assignee);
        if (t.subtasks) traverse(t.subtasks);
      });
    };
    traverse(tasks);
    return Array.from(set).sort();
  }, [tasks]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col: keyof ColumnVisibility) => {
    setVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const processedTasks = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    
    // Recursive Filtering Function
    const filterRecursive = (list: Task[]): Task[] => {
      return list.reduce((acc: Task[], t) => {
        // 1. Text Search
        const textMatch = 
          t.title.toLowerCase().includes(lowerTerm) || 
          t.description?.toLowerCase().includes(lowerTerm) ||
          t.assignee?.toLowerCase().includes(lowerTerm) ||
          t.department.toLowerCase().includes(lowerTerm);

        // 2. Column Filters
        const statusMatch = filters.status === 'ALL' || t.status === filters.status;
        const typeMatch = filters.type === 'ALL' || 
          (filters.type === 'GENERAL' && !t.isSpecificTask) || 
          (filters.type === 'SPECIFIC' && t.isSpecificTask);
        const assigneeMatch = filters.assignee === 'ALL' || t.assignee === filters.assignee;

        const isDirectMatch = textMatch && statusMatch && typeMatch && assigneeMatch;

        // Recursion for subtasks
        const filteredSubtasks = t.subtasks ? filterRecursive(t.subtasks) : [];
        
        // Show if this task matches OR if any subtask matches (to preserve hierarchy)
        if (isDirectMatch || filteredSubtasks.length > 0) {
          acc.push({ ...t, subtasks: filteredSubtasks });
        }
        return acc;
      }, []);
    };

    let filtered = filterRecursive(tasks);

    // 3. Sort (Top Level)
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const valA = a[sortConfig.key!] || '';
        const valB = b[sortConfig.key!] || '';
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tasks, searchTerm, sortConfig, filters]);

  const activeFiltersCount = (filters.status !== 'ALL' ? 1 : 0) + (filters.type !== 'ALL' ? 1 : 0) + (filters.assignee !== 'ALL' ? 1 : 0);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown size={14} className="ml-1 text-gray-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  const HeaderCell = ({ label, colKey }: { label: string; colKey: SortKey }) => (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => handleSort(colKey)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon colKey={colKey} />
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 max-w-full">
        {/* Search */}
        <div className="flex-1 flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm min-w-0">
          <Search size={18} className="text-gray-400 mr-2 ml-1 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar procesos, áreas..." 
            className="w-full text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
           {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex space-x-2">
           {/* View Options Menu (Column Visibility) */}
           <div className="relative" ref={visibilityRef}>
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className={`flex items-center justify-center p-2.5 rounded-lg border transition shadow-sm
                ${showVisibilityMenu ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              title="Editar visualización de columnas"
            >
              <SlidersHorizontal size={18} />
            </button>
            
            {showVisibilityMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 p-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-700 mb-2">
                   <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Ver Columnas</span>
                   <button 
                     onClick={() => setVisibility({ startDate: true, department: true, assignee: true, status: true, type: true })}
                     className="text-[10px] text-blue-400 hover:text-blue-300"
                   >
                     Restaurar
                   </button>
                </div>
                <div className="space-y-0.5">
                   {[
                     { key: 'status', label: 'Estado' },
                     { key: 'type', label: 'Tipo' },
                     { key: 'department', label: 'Área / Programa' },
                     { key: 'assignee', label: 'Responsable' },
                     { key: 'startDate', label: 'Fechas' },
                   ].map((col) => (
                     <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key as keyof ColumnVisibility)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors group"
                     >
                       <span className="flex items-center">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${visibility[col.key as keyof ColumnVisibility] ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                           {visibility[col.key as keyof ColumnVisibility] && <Check size={10} className="text-white" />}
                         </div>
                         {col.label}
                       </span>
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center px-4 py-2.5 rounded-lg border text-sm font-medium transition shadow-sm
                ${showFilterMenu || activeFiltersCount > 0 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <Filter size={18} className="mr-2" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-10 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-800">Filtros Avanzados</span>
                  {(activeFiltersCount > 0) && (
                    <button 
                      onClick={() => setFilters({ status: 'ALL', type: 'ALL', assignee: 'ALL' })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus | 'ALL' })}
                      className="w-full text-sm border-gray-300 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">Todos los estados</option>
                      {Object.values(TaskStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Tarea</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value as 'ALL' | 'GENERAL' | 'SPECIFIC' })}
                      className="w-full text-sm border-gray-300 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">Todos los tipos</option>
                      <option value="GENERAL">Procesos Generales</option>
                      <option value="SPECIFIC">Tareas Específicas</option>
                    </select>
                  </div>

                  {/* Assignee Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                    <select
                      value={filters.assignee}
                      onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                      className="w-full text-sm border-gray-300 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">Cualquier responsable</option>
                      {uniqueAssignees.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      {/* Changed hidden md:block to hidden lg:block */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <HeaderCell label="Actividad / Proceso" colKey="title" />
                {visibility.startDate && <HeaderCell label="Fechas" colKey="startDate" />}
                {visibility.department && <HeaderCell label="Área" colKey="department" />}
                {visibility.assignee && <HeaderCell label="Responsable" colKey="assignee" />}
                {visibility.type && <HeaderCell label="Tipo" colKey="isSpecificTask" />}
                {visibility.status && <HeaderCell label="Estado" colKey="status" />}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange}
                  onTaskUpdate={onTaskUpdate}
                  onEdit={onEdit}
                  onView={onView}
                  sortConfig={sortConfig}
                  visibility={visibility}
                />
              ))}
              {processedTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    {searchTerm || activeFiltersCount > 0 
                      ? 'No se encontraron resultados para tu búsqueda o filtros.' 
                      : 'No hay procesos registrados para esta área.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE/TABLET CARD VIEW --- */}
      {/* Changed md:hidden to lg:hidden */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {processedTasks.map((task) => (
          <MobileTaskCard 
            key={task.id} 
            task={task}
            onStatusChange={onStatusChange}
            onTaskUpdate={onTaskUpdate}
            onEdit={onEdit}
            onView={onView}
            visibility={visibility}
          />
        ))}
         {processedTasks.length === 0 && (
            <div className="col-span-1 md:col-span-2 px-6 py-10 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
              {searchTerm || activeFiltersCount > 0 
                ? 'No se encontraron resultados.' 
                : 'No hay datos para mostrar.'}
            </div>
          )}
      </div>

    </div>
  );
};