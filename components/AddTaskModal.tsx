
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, Profile, DepartmentEnum, CalendarEvent, EventCategory } from '../types';
import { 
  X, 
  Save, 
  Layers, 
  List, 
  User, 
  Info,
  Calendar,
  Globe,
  Tag
} from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, parentId?: string) => void;
  onSaveEvent: (event: Partial<CalendarEvent>) => void;
  currentDepartment: string;
  existingTasks: Task[];
  availableDepartments: string[];
  users: Profile[];
  eventCategories: EventCategory[];
}

type RecordType = 'PROCESS' | 'TASK' | 'EVENT';

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveEvent,
  currentDepartment,
  existingTasks,
  availableDepartments,
  users,
  eventCategories
}) => {
  // Common State
  const [recordType, setRecordType] = useState<RecordType>('PROCESS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Task Specific
  const [assigneeId, setAssigneeId] = useState('');
  const [parentId, setParentId] = useState('');

  // Event Specific
  const [categoryId, setCategoryId] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(''); 
      setDescription(''); 
      setStartDate(''); 
      setEndDate(''); 
      setAssigneeId(''); 
      setParentId('');
      setRecordType('PROCESS');
      setIsGlobal(false);
      
      // Default to first category if available
      if (eventCategories.length > 0) {
          setCategoryId(eventCategories[0].id);
      } else {
          setCategoryId('');
      }

      if (currentDepartment !== 'General') {
        setDepartment(currentDepartment);
      } else {
        setDepartment('');
      }
    }
  }, [isOpen, currentDepartment, eventCategories]);

  const parentProcesses = useMemo(() => {
    return existingTasks.filter(t => !t.isSpecificTask && t.department === department);
  }, [existingTasks, department]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => u.department === department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !title) return;
    
    if (recordType === 'EVENT') {
        onSaveEvent({
            title,
            description,
            department,
            start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
            end_date: endDate ? new Date(endDate).toISOString() : undefined,
            category_id: categoryId,
            is_global: isGlobal
        });
    } else {
        const assignedUser = users.find(u => u.id === assigneeId);
        onSave({
          id: crypto.randomUUID(),
          department,
          title,
          description,
          startDate,
          endDate,
          assignee_id: assigneeId,
          assignee_name: assignedUser?.full_name,
          isSpecificTask: recordType === 'TASK',
          status: TaskStatus.PENDING,
        } as Task, recordType === 'TASK' ? parentId : undefined);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${recordType === 'EVENT' ? 'bg-purple-600' : 'bg-white/10'}`}>
                {recordType === 'EVENT' ? <Calendar size={20} /> : <Layers size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Nuevo Registro</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {recordType === 'EVENT' ? 'Calendario Institucional' : `Operaciones • ${department || 'Seleccionar Área'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form id="task-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* TABS SELECTION */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tipo de Registro</label>
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setRecordType('PROCESS')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${recordType === 'PROCESS' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Layers size={14} /> Proceso
              </button>
              <button
                type="button"
                onClick={() => setRecordType('TASK')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${recordType === 'TASK' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <List size={14} /> Tarea
              </button>
              <button
                type="button"
                onClick={() => setRecordType('EVENT')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${recordType === 'EVENT' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Calendar size={14} /> Evento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Departamento</label>
              <select 
                value={department} 
                onChange={e => setDepartment(e.target.value)} 
                className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            {recordType !== 'EVENT' ? (
                <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Responsable</label>
                <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)} 
                    className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Asignar personal...</option>
                    {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                </div>
            ) : (
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoría de Evento</label>
                    <select 
                        value={categoryId} 
                        onChange={e => setCategoryId(e.target.value)} 
                        className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                    >
                        {eventCategories.length === 0 && <option value="">Sin categorías</option>}
                        {eventCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}
          </div>

          {recordType === 'TASK' && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                Proceso Vinculado <Info size={12} className="text-blue-500" />
              </label>
              <select 
                value={parentId} 
                onChange={e => setParentId(e.target.value)} 
                required={recordType === 'TASK'}
                className="w-full bg-blue-50/50 border-blue-100 rounded-xl text-sm font-semibold text-blue-800 focus:ring-blue-500"
              >
                <option value="">Seleccionar proceso padre...</option>
                {parentProcesses.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {recordType === 'EVENT' ? 'Nombre del Evento' : 'Título de la actividad'}
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder={recordType === 'EVENT' ? "Ej: Ceremonia de Graduación" : "Ej: Auditoría de nómina..."}
              className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5" 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Descripción / Detalles</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 resize-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha Inicio</label>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required={recordType === 'EVENT'} className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 px-4 py-2.5" />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                   {recordType === 'EVENT' ? 'Fecha Fin (Opcional)' : 'Fecha Límite'}
               </label>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 px-4 py-2.5" />
             </div>
          </div>

          {recordType === 'EVENT' && (
             <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm">
                    <Globe size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Evento Global</p>
                    <p className="text-[10px] text-slate-500">Visible para todos los departamentos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
             </div>
          )}

        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Descartar</button>
          <button form="task-form" type="submit" className={`px-8 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 ${recordType === 'EVENT' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
            <Save size={16} /> {recordType === 'EVENT' ? 'Agendar Evento' : 'Crear Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};
