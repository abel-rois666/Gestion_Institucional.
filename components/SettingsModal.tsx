
import React, { useState } from 'react';
import { X, Save, Settings, Plus, Trash2, Tag, Building2, Monitor, Globe, ChevronRight } from 'lucide-react';
import { AppSettings, Profile, UserRole, ResourceCategory } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  departments: string[];
  onUpdateDepartments: (newDepartments: string[]) => void;
  departmentCounts: Record<string, number>;
  currentUser: Profile;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  departments,
  onUpdateDepartments,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'resources'>(
    currentUser.role === UserRole.ADMIN ? 'general' : 'resources'
  );
  
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [depts, setDepts] = useState<string[]>(departments);
  const [newDeptName, setNewDeptName] = useState('');
  const [newCatName, setNewCatName] = useState('');

  if (!isOpen) return null;

  const handleAddDepartment = () => {
    if (!newDeptName.trim() || depts.includes(newDeptName.trim())) return;
    const updated = [...depts, newDeptName.trim()];
    setDepts(updated);
    setNewDeptName('');
  };

  const handleRemoveDepartment = (name: string) => {
    const updated = depts.filter(d => d !== name);
    setDepts(updated);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: ResourceCategory = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      owner_id: currentUser.id,
      is_global: currentUser.role === UserRole.ADMIN
    };
    setFormData({...formData, resourceCategories: [...formData.resourceCategories, newCat]});
    setNewCatName('');
  };

  const handleSaveAll = () => {
    onSaveSettings(formData);
    onUpdateDepartments(depts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Panel de Configuración</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ajustes del Sistema UniGestor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
          {currentUser.role === UserRole.ADMIN && (
            <>
              <button 
                onClick={() => setActiveTab('general')} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Monitor size={14} /> Identidad
              </button>
              <button 
                onClick={() => setActiveTab('departments')} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'departments' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Building2 size={14} /> Áreas
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab('resources')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Tag size={14} /> Categorías
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre de la Institución / App</label>
                  <input 
                    type="text" 
                    value={formData.appName} 
                    onChange={e => setFormData({...formData, appName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Globe size={12} /> Zona Horaria Operativa
                  </label>
                  <select 
                    value={formData.timeZone} 
                    onChange={e => setFormData({...formData, timeZone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="America/Mexico_City">Ciudad de México (CST)</option>
                    <option value="America/New_York">Nueva York (EST)</option>
                    <option value="Europe/Madrid">Madrid (CET)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="Nuevo departamento (ej: Posgrado)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleAddDepartment}
                  className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {depts.map(dept => (
                  <div key={dept} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{dept}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveDepartment(dept)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nueva categoría de recursos..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleAddCategory}
                  className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {formData.resourceCategories.map(cat => {
                  const isOwner = cat.owner_id === currentUser.id || currentUser.role === UserRole.ADMIN;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                        <Tag size={16} className="text-slate-400" />
                        <div>
                          <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                          {cat.is_global && (
                            <span className="ml-2 text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest ring-1 ring-blue-600/10">Global</span>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <button 
                          onClick={() => setFormData({...formData, resourceCategories: formData.resourceCategories.filter(c => c.id !== cat.id)})}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveAll}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save size={16} /> Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
