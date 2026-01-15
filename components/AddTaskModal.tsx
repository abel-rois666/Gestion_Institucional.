
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, Profile, DepartmentEnum } from '../types';
import { 
  X, 
  Save, 
  Layers, 
  List, 
  User, 
  Info
} from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, parentId?: string) => void; 
  currentDepartment: string;
  existingTasks: Task[];
  availableDepartments: string[];
  users: Profile[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDepartment,
  existingTasks,
  availableDepartments,
  users
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSpecific, setIsSpecific] = useState(false);
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(''); 
      setDescription(''); 
      setStartDate(''); 
      setEndDate(''); 
      setAssigneeId(''); 
      setIsSpecific(false); 
      setParentId('');
      if (currentDepartment !== 'General') setDepartment(currentDepartment);
    }
  }, [isOpen, currentDepartment]);

  const parentProcesses = useMemo(() => {
    return existingTasks.filter(t => !t.isSpecificTask && t.department === department);
  }, [existingTasks, department]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => u.department === department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !title) return;
    
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
      isSpecificTask: isSpecific,
      status: TaskStatus.PENDING,
    } as Task, isSpecific ? parentId : undefined);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><Layers size={20} /></div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Nuevo Registro</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Operaciones • {department || 'Seleccionar Área'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form id="task-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Nivel de Organización</label>
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setIsSpecific(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${!isSpecific ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Layers size={14} /> Proceso General
              </button>
              <button
                type="button"
                onClick={() => setIsSpecific(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${isSpecific ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <List size={14} /> Tarea Específica
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
          </div>

          {isSpecific && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                Proceso Vinculado <Info size={12} className="text-blue-500" />
              </label>
              <select 
                value={parentId} 
                onChange={e => setParentId(e.target.value)} 
                required={isSpecific}
                className="w-full bg-blue-50/50 border-blue-100 rounded-xl text-sm font-semibold text-blue-800 focus:ring-blue-500"
              >
                <option value="">Seleccionar proceso padre...</option>
                {parentProcesses.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Título de la actividad</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ej: Auditoría de nómina..."
              className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5" 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contexto / Instrucciones</label>
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
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 px-4 py-2.5" />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha Límite</label>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-blue-500 px-4 py-2.5" />
             </div>
          </div>
        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Descartar</button>
          <button form="task-form" type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
            <Save size={16} /> Crear Registro
          </button>
        </div>
      </div>
    </div>
  );
};
