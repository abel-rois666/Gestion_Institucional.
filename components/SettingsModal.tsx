import React, { useState } from 'react';
import { X, Save, Settings, Plus, Trash2, Edit2, Check, AlertCircle, Tag, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  departments: string[];
  onUpdateDepartments: (newDepartments: string[], oldName?: string, newName?: string) => void;
  departmentCounts: Record<string, number>; // To prevent deleting depts with tasks
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  departments,
  onUpdateDepartments,
  departmentCounts
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'resources'>('general');
  
  // Local state for General Settings
  const [formData, setFormData] = useState<AppSettings>(settings);

  // Local state for Departments
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Local state for Resource Categories (managed via formData directly for simplicity)
  const [newCatName, setNewCatName] = useState('');

  // State for Confirmation Dialog
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'dept' | 'category', name: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  // --- Departments Logic ---
  const handleAddDept = () => {
    if (newDeptName.trim() && !departments.includes(newDeptName.trim())) {
      onUpdateDepartments([...departments, newDeptName.trim()]);
      setNewDeptName('');
    }
  };

  const handleDeleteDept = (dept: string) => {
    if (departmentCounts[dept] > 0) {
      alert(`No se puede eliminar "${dept}" porque tiene ${departmentCounts[dept]} tareas asociadas.`);
      return;
    }
    setConfirmDelete({ type: 'dept', name: dept });
  };

  const startEdit = (dept: string) => {
    setEditingDept(dept);
    setEditValue(dept);
  };

  const saveEdit = () => {
    if (editingDept && editValue.trim() && editValue !== editingDept) {
      if (departments.includes(editValue.trim())) {
        alert("Ya existe un departamento con ese nombre.");
        return;
      }
      const updatedList = departments.map(d => d === editingDept ? editValue.trim() : d);
      onUpdateDepartments(updatedList, editingDept, editValue.trim());
    }
    setEditingDept(null);
    setEditValue('');
  };

  // --- Resource Categories Logic ---
  const handleAddCategory = () => {
    if (newCatName.trim() && !formData.resourceCategories.includes(newCatName.trim())) {
      const updated = [...(formData.resourceCategories || []), newCatName.trim()];
      setFormData({...formData, resourceCategories: updated});
      setNewCatName('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setConfirmDelete({ type: 'category', name: cat });
  };

  // --- Execution Logic ---
  const executeDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'dept') {
      onUpdateDepartments(departments.filter(d => d !== confirmDelete.name));
    } else {
      const updated = formData.resourceCategories.filter(c => c !== confirmDelete.name);
      setFormData({...formData, resourceCategories: updated});
    }
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
            <h2 className="text-lg font-bold flex items-center">
              <Settings className="mr-2" size={20} />
              Configuración del Sistema
            </h2>
            <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded transition">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'departments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('departments')}
            >
              Departamentos
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('resources')}
            >
              Categorías Recursos
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'general' ? (
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Programa / Institución</label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => setFormData({...formData, appName: e.target.value})}
                    className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recomendado: Imagen PNG o SVG transparente.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                  <select
                    value={formData.timeZone}
                    onChange={(e) => setFormData({...formData, timeZone: e.target.value})}
                    className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Tijuana">Tijuana (GMT-8)</option>
                    <option value="America/Monterrey">Monterrey (GMT-6)</option>
                    <option value="America/New_York">New York (EST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Save size={16} className="mr-2" />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : activeTab === 'departments' ? (
              <div className="space-y-6">
                {/* Add New Dept */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Nombre del nuevo departamento..."
                    className="flex-1 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddDept}
                    disabled={!newDeptName.trim()}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* List Depts */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center justify-between p-3">
                      {editingDept === dept ? (
                        <div className="flex items-center flex-1 mr-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 rounded border-gray-300 border p-1 text-sm mr-2"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded">
                            <Check size={18} />
                          </button>
                          <button onClick={() => setEditingDept(null)} className="text-gray-500 hover:bg-gray-100 p-1 rounded ml-1">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                           <span className="text-sm font-medium text-gray-700">{dept}</span>
                           {departmentCounts[dept] > 0 && (
                             <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full" title="Tareas activas">
                               {departmentCounts[dept]} tareas
                             </span>
                           )}
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        {!editingDept && (
                          <button 
                            onClick={() => startEdit(dept)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                            title="Renombrar"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {!editingDept && (
                          <button 
                            onClick={() => handleDeleteDept(dept)}
                            className={`p-1.5 rounded transition-colors ${
                              departmentCounts[dept] > 0 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={departmentCounts[dept] > 0 ? "No se puede eliminar (tiene tareas)" : "Eliminar"}
                            disabled={departmentCounts[dept] > 0}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-800">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>
                    Nota: Al renombrar un departamento, todas las tareas asociadas se actualizarán automáticamente.
                  </p>
                </div>
              </div>
            ) : (
               <div className="space-y-6">
                {/* Add New Category */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nueva categoría (ej. Normatividad)..."
                    className="flex-1 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* List Categories */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {(formData.resourceCategories || []).map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                         <Tag size={16} className="text-gray-400"/>
                         <span className="text-sm font-medium text-gray-700">{cat}</span>
                      </div>

                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(formData.resourceCategories || []).length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">No hay categorías definidas.</div>
                  )}
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg flex items-start text-xs text-purple-800">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>
                    Estas categorías estarán disponibles al adjuntar recursos a las tareas. 
                    (Nota: Se guardarán los cambios al hacer clic en "Guardar Cambios" en la pestaña General o al cambiar de pestaña, asegúrate de guardar la configuración global).
                  </p>
                </div>
                
                <div className="flex justify-end pt-2">
                   <button
                    onClick={(e) => handleSaveGeneral(e)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Save size={16} className="mr-2" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¿Eliminar {confirmDelete.type === 'dept' ? 'departamento' : 'categoría'}?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de eliminar <span className="font-semibold text-gray-800">"{confirmDelete.name}"</span>. 
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
