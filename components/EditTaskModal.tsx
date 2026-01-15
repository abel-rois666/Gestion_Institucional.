
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Profile } from '../types';
import { X, Save, Edit3, Calendar, User, AlignLeft, Layers, List } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task: Task | null;
  users: Profile[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  users
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDate(task.startDate || '');
      setEndDate(task.endDate || '');
      setAssigneeId(task.assignee_id || '');
      setStatus(task.status);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const filteredUsers = users.filter(u => u.department === task.department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find(u => u.id === assigneeId);
    
    onSave({
      ...task,
      title,
      description,
      startDate,
      endDate,
      assignee_id: assigneeId,
      assignee_name: assignedUser?.full_name,
      status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className={`px-6 py-4 flex justify-between items-center text-white transition-colors duration-300 ${
          task.isSpecificTask ? 'bg-purple-700' : 'bg-blue-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {task.isSpecificTask ? <List size={20} /> : <Layers size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight text-white">
                Editar {task.isSpecificTask ? 'Tarea Específica' : 'Proceso General'}
              </h2>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{task.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Registro</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 transition-all" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User size={12} /> Responsable
              </label>
              <select 
                value={assigneeId} 
                onChange={e => setAssigneeId(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Sin asignar</option>
                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado Operativo</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as TaskStatus)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                 <Calendar size={12} /> Fecha Inicio
               </label>
               <input 
                 type="date" 
                 value={startDate} 
                 onChange={e => setStartDate(e.target.value)} 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none px-3 py-2 transition-all" 
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                 <Calendar size={12} /> Fecha Límite
               </label>
               <input 
                 type="date" 
                 value={endDate} 
                 onChange={e => setEndDate(e.target.value)} 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none px-3 py-2 transition-all" 
               />
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <AlignLeft size={12} /> Notas y Contexto
            </label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={4} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none px-4 py-3 resize-none transition-all" 
              placeholder="Añade detalles relevantes..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`px-8 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
                task.isSpecificTask ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              <Save size={16} /> Actualizar {task.isSpecificTask ? 'Tarea' : 'Proceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
