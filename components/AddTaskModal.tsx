import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { X, Save, Layers, List, Edit2 } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, parentId?: string) => void; 
  currentDepartment: string;
  existingTasks: Task[];
  taskToEdit?: Task | null;
  availableDepartments: string[]; // New prop for dynamic list
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDepartment,
  existingTasks,
  taskToEdit,
  availableDepartments
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');
  
  // Logic for Hierarchy
  const [isSpecific, setIsSpecific] = useState(false);
  const [parentId, setParentId] = useState('');

  // Reset or Populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        // Edit Mode
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setDepartment(taskToEdit.department);
        setStartDate(taskToEdit.startDate || '');
        setEndDate(taskToEdit.endDate || '');
        setAssignee(taskToEdit.assignee || '');
        setIsSpecific(taskToEdit.isSpecificTask);
      } else {
        // Create Mode
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setAssignee('');
        setIsSpecific(false);
        setParentId('');
        
        // Auto-select department if valid
        if (currentDepartment !== 'General' && availableDepartments.includes(currentDepartment)) {
          setDepartment(currentDepartment);
        } else {
          setDepartment('');
        }
      }
    }
  }, [isOpen, taskToEdit, currentDepartment, availableDepartments]);

  if (!isOpen) return null;

  const potentialParents = existingTasks.filter(
    t => t.department === department && !t.isSpecificTask && t.id !== taskToEdit?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !department) return;

    if (!taskToEdit && isSpecific && !parentId) {
      alert("Por favor selecciona un Proceso Padre para esta tarea específica.");
      return;
    }

    const taskData: Task = {
      id: taskToEdit ? taskToEdit.id : crypto.randomUUID(),
      department: department,
      title,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      assignee: assignee || undefined,
      isSpecificTask: isSpecific,
      status: taskToEdit ? taskToEdit.status : TaskStatus.PENDING,
      subtasks: taskToEdit ? taskToEdit.subtasks : [] 
    };

    onSave(taskData, (!taskToEdit && isSpecific) ? parentId : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center">
            {taskToEdit ? <Edit2 className="mr-2" size={20}/> : (isSpecific ? <List className="mr-2" /> : <Layers className="mr-2" />)}
            {taskToEdit ? 'Editar Tarea / Proceso' : (isSpecific ? 'Agregar Tarea Específica' : 'Agregar Proceso General')}
          </h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                if (!taskToEdit) setParentId('');
              }}
              disabled={!!taskToEdit || currentDepartment !== 'General'} 
              className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              required
            >
              <option value="">Seleccionar área...</option>
              {availableDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Task Type Toggle */}
          {!taskToEdit && (
            <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
               <div className="flex items-center">
                 <input 
                    type="radio" 
                    id="type-general" 
                    name="taskType" 
                    checked={!isSpecific} 
                    onChange={() => setIsSpecific(false)}
                    className="text-blue-600 focus:ring-blue-500"
                 />
                 <label htmlFor="type-general" className="ml-2 text-sm text-gray-700 font-medium">Proceso General</label>
               </div>
               <div className="flex items-center">
                 <input 
                    type="radio" 
                    id="type-specific" 
                    name="taskType" 
                    checked={isSpecific} 
                    onChange={() => setIsSpecific(true)}
                    className="text-purple-600 focus:ring-purple-500"
                 />
                 <label htmlFor="type-specific" className="ml-2 text-sm text-gray-700 font-medium">Tarea Específica</label>
               </div>
            </div>
          )}

          {/* Parent Selection */}
          {!taskToEdit && isSpecific && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proceso General (Padre) <span className="text-red-500">*</span>
              </label>
              {potentialParents.length > 0 ? (
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border-purple-200 bg-purple-50 border p-2 text-sm focus:ring-2 focus:ring-purple-500"
                  required={isSpecific}
                >
                  <option value="">-- Seleccionar Proceso --</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-red-500 mt-1">
                  No hay procesos generales registrados en este departamento.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título / Nombre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Gestión de becas"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Término</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (Opcional)</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Juan Pérez"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
