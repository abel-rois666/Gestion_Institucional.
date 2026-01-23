
import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Plus, Trash2, Tag, Building2, Monitor, Globe, Users, Search, UserPlus, Edit3, Shield, Check, AlertTriangle, CalendarDays, Palette, Package } from 'lucide-react';
import { AppSettings, Profile, UserRole, ResourceCategory, DepartmentEnum, EventCategory, InventoryCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  departments: string[];
  onUpdateDepartments: (newDepartments: string[]) => void;
  departmentCounts: Record<string, number>;
  categoryCounts?: Record<string, number>;
  onRenameDepartment?: (oldName: string, newName: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  currentUser: Profile;
  
  // User Management
  users: Profile[];
  onSaveUser: (user: Profile) => void;
  onDeleteUser: (userId: string) => void;

  // Event Categories Management
  eventCategories: EventCategory[];
  onSaveEventCategory: (category: EventCategory) => void;
  onDeleteEventCategory: (categoryId: string) => void;
}

const COLORS = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'pink', class: 'bg-pink-500' },
  { name: 'gray', class: 'bg-gray-500' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  departments,
  onUpdateDepartments,
  departmentCounts,
  categoryCounts = {},
  onRenameDepartment,
  onRenameCategory,
  currentUser,
  users,
  onSaveUser,
  onDeleteUser,
  eventCategories,
  onSaveEventCategory,
  onDeleteEventCategory
}) => {
  const isHRorAdmin = currentUser.role === UserRole.ADMIN || currentUser.department === DepartmentEnum.HR_MATERIALS;

  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'resources' | 'events' | 'users' | 'inventory'>(
    currentUser.role === UserRole.ADMIN ? 'general' : 'resources'
  );
  
  // Settings Logic
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [depts, setDepts] = useState<string[]>(departments);
  const [newDeptName, setNewDeptName] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // Event Categories Logic
  const [newEventCatName, setNewEventCatName] = useState('');
  const [newEventCatColor, setNewEventCatColor] = useState('blue');

  // Inventory Categories Logic
  const [invCategories, setInvCategories] = useState<InventoryCategory[]>([]);
  const [newInvCatName, setNewInvCatName] = useState('');
  const [newInvCatPrefix, setNewInvCatPrefix] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValue2, setEditValue2] = useState(''); // Used for prefix
  const [editColor, setEditColor] = useState('');

  // Delete Confirmation State
  const [pendingDelete, setPendingDelete] = useState<{ type: 'dept' | 'cat' | 'user' | 'event_cat' | 'inv_cat', id: string, name: string, count: number } | null>(null);

  // User Management Logic
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<Profile>>({
    role: UserRole.AUXILIAR,
    department: DepartmentEnum.ACADEMIC
  });

  useEffect(() => {
      if (isOpen && isHRorAdmin && isSupabaseConfigured) {
          fetchInventoryCategories();
      }
  }, [isOpen, isHRorAdmin]);

  const fetchInventoryCategories = async () => {
      const { data } = await supabase.from('inventory_categories').select('*').order('name');
      if (data) setInvCategories(data);
  };

  if (!isOpen) return null;

  // -- Unified Delete Logic --
  
  const requestDelete = (type: 'dept' | 'cat' | 'user' | 'event_cat' | 'inv_cat', id: string, name: string, count: number = 0) => {
    setPendingDelete({ type, id, name, count });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'dept') {
      const updated = depts.filter(d => d !== pendingDelete.id);
      setDepts(updated);
    } else if (pendingDelete.type === 'cat') {
      setFormData(prev => ({
        ...prev,
        resourceCategories: prev.resourceCategories.filter(c => c.id !== pendingDelete.id)
      }));
    } else if (pendingDelete.type === 'user') {
      onDeleteUser(pendingDelete.id);
    } else if (pendingDelete.type === 'event_cat') {
      onDeleteEventCategory(pendingDelete.id);
    } else if (pendingDelete.type === 'inv_cat') {
        if (isSupabaseConfigured) {
            await supabase.from('inventory_categories').delete().eq('id', pendingDelete.id);
            fetchInventoryCategories();
        }
    }
    
    setPendingDelete(null);
  };

  // -- Inventory Categories Handlers --
  const handleAddInvCategory = async () => {
      if (!newInvCatName.trim() || !newInvCatPrefix.trim()) return;
      if (isSupabaseConfigured) {
          await supabase.from('inventory_categories').insert({
              name: newInvCatName.trim(),
              prefix: newInvCatPrefix.trim().toUpperCase(),
              current_sequence: 0
          });
          fetchInventoryCategories();
      }
      setNewInvCatName('');
      setNewInvCatPrefix('');
  };

  const startEditInvCat = (cat: InventoryCategory) => {
      setEditingItem(cat.id);
      setEditValue(cat.name);
      setEditValue2(cat.prefix);
  };

  const saveEditInvCat = async (cat: InventoryCategory) => {
      if (editValue.trim() && editValue2.trim()) {
          if (isSupabaseConfigured) {
              await supabase.from('inventory_categories').update({
                  name: editValue.trim(),
                  prefix: editValue2.trim().toUpperCase()
              }).eq('id', cat.id);
              fetchInventoryCategories();
          }
      }
      setEditingItem(null);
  };

  // -- Event Categories Handlers --
  const handleAddEventCategory = () => {
    if (!newEventCatName.trim()) return;
    onSaveEventCategory({
      id: crypto.randomUUID(),
      name: newEventCatName.trim(),
      color: newEventCatColor
    });
    setNewEventCatName('');
    setNewEventCatColor('blue');
  };

  const startEditEventCat = (cat: EventCategory) => {
    setEditingItem(cat.id);
    setEditValue(cat.name);
    setEditColor(cat.color);
  };

  const saveEditEventCat = (cat: EventCategory) => {
    if (editValue.trim()) {
      onSaveEventCategory({
        ...cat,
        name: editValue.trim(),
        color: editColor
      });
    }
    setEditingItem(null);
  };

  // -- Other Handlers (Existing) --
  const handleAddDepartment = () => {
    if (!newDeptName.trim() || depts.includes(newDeptName.trim())) return;
    const updated = [...depts, newDeptName.trim()];
    setDepts(updated);
    setNewDeptName('');
  };

  const startEditDepartment = (name: string) => {
    setEditingItem(name);
    setEditValue(name);
  };

  const saveEditDepartment = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName && !depts.includes(editValue.trim())) {
      if (onRenameDepartment) {
        onRenameDepartment(oldName, editValue.trim());
        setDepts(prev => prev.map(d => d === oldName ? editValue.trim() : d));
      }
    }
    setEditingItem(null);
    setEditValue('');
  };

  const toggleEventCalendar = (dept: string) => {
    const currentConfig = formData.departmentConfigs?.[dept] || { enableEvents: false };
    setFormData(prev => ({
      ...prev,
      departmentConfigs: {
        ...prev.departmentConfigs,
        [dept]: { ...currentConfig, enableEvents: !currentConfig.enableEvents }
      }
    }));
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

  const startEditCategory = (cat: ResourceCategory) => {
    setEditingItem(cat.id);
    setEditValue(cat.name);
  };

  const saveEditCategory = (cat: ResourceCategory) => {
    if (editValue.trim() && editValue !== cat.name) {
       if (onRenameCategory) {
         onRenameCategory(cat.name, editValue.trim());
       }
       setFormData(prev => ({
         ...prev,
         resourceCategories: prev.resourceCategories.map(c => c.id === cat.id ? { ...c, name: editValue.trim() } : c)
       }));
    }
    setEditingItem(null);
    setEditValue('');
  };

  const handleSaveAll = () => {
    onSaveSettings(formData);
    onUpdateDepartments(depts);
    onClose();
  };

  // User Management
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const startNewUser = () => {
    setEditingUserId(null);
    setUserFormData({ role: UserRole.AUXILIAR, department: departments[0] || DepartmentEnum.ACADEMIC });
    setIsUserFormOpen(true);
  };

  const startEditUser = (user: Profile) => {
    setEditingUserId(user.id);
    setUserFormData({
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      role: user.role
    });
    setIsUserFormOpen(true);
  };

  const handleSaveUserInternal = () => {
    if (!userFormData.full_name || !userFormData.email) return;
    if (editingUserId) {
      const updatedUser = users.find(u => u.id === editingUserId);
      if (updatedUser) {
        onSaveUser({
          ...updatedUser,
          full_name: userFormData.full_name,
          email: userFormData.email,
          department: userFormData.department || updatedUser.department,
          role: userFormData.role || updatedUser.role
        });
      }
    } else {
      onSaveUser({
        id: crypto.randomUUID(),
        full_name: userFormData.full_name,
        email: userFormData.email,
        department: userFormData.department || departments[0] || DepartmentEnum.ACADEMIC,
        role: userFormData.role || UserRole.AUXILIAR,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userFormData.full_name}`
      });
    }
    setIsUserFormOpen(false);
    setEditingUserId(null);
    setUserFormData({ role: UserRole.AUXILIAR, department: departments[0] || DepartmentEnum.ACADEMIC });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* CONFIRMATION OVERLAY */}
      {pendingDelete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-red-600">
                 <div className="p-2 bg-red-50 rounded-xl">
                   <AlertTriangle size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">¿Eliminar elemento?</h3>
              </div>
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-2">Estás a punto de eliminar <strong>"{pendingDelete.name}"</strong>.</p>
                {pendingDelete.count > 0 && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">⚠️ Tiene {pendingDelete.count} elementos asociados.</div>}
              </div>
              <div className="flex gap-3 justify-end">
                 <button onClick={() => setPendingDelete(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                 <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100">Sí, eliminar</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 relative">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg"><Settings size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">Panel de Configuración</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">UniGestor System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0 overflow-x-auto">
          {currentUser.role === UserRole.ADMIN && (
            <>
              <button onClick={() => setActiveTab('general')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Monitor size={14} /> Identidad</button>
              <button onClick={() => setActiveTab('departments')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'departments' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Building2 size={14} /> Áreas</button>
            </>
          )}
          <button onClick={() => setActiveTab('resources')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'resources' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Tag size={14} /> Recursos</button>
          <button onClick={() => setActiveTab('events')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><CalendarDays size={14} /> Eventos</button>
          {isHRorAdmin && (
              <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Package size={14} /> Inventario</button>
          )}
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={() => setActiveTab('users')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Users size={14} /> Usuarios</button>
          )}
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre de la Institución</label>
                  <input type="text" value={formData.appName} onChange={e => setFormData({...formData, appName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={12} /> Zona Horaria</label>
                  <select value={formData.timeZone} onChange={e => setFormData({...formData, timeZone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="America/Mexico_City">Ciudad de México (CST)</option>
                    <option value="America/New_York">Nueva York (EST)</option>
                    <option value="Europe/Madrid">Madrid (CET)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="flex gap-2">
                <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Nuevo departamento..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={handleAddDepartment} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {depts.map(dept => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Building2 size={16} /></div>
                        {editingItem === dept ? (
                          <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 border-b border-blue-500 bg-transparent outline-none text-sm font-bold" autoFocus />
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{dept}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                {departmentCounts[dept] > 0 && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[9px] font-bold">{departmentCounts[dept]} usos</span>}
                                {formData.departmentConfigs?.[dept]?.enableEvents && <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md"><CalendarDays size={10} /> Cal. Eventos</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingItem !== dept && (
                           <button onClick={() => toggleEventCalendar(dept)} className={`p-2 rounded-lg transition-all mr-2 ${formData.departmentConfigs?.[dept]?.enableEvents ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-300 hover:text-green-500'}`}><CalendarDays size={16} /></button>
                        )}
                        {editingItem === dept ? (
                          <>
                             <button onClick={() => saveEditDepartment(dept)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                             <button onClick={() => setEditingItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditDepartment(dept)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                            <button onClick={() => requestDelete('dept', dept, dept, departmentCounts[dept] || 0)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* INVENTORY CATEGORIES (NEW) */}
          {activeTab === 'inventory' && isHRorAdmin && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <div className="flex gap-2">
                      <div className="flex-1 flex gap-2">
                          <input 
                              type="text" 
                              value={newInvCatName} 
                              onChange={e => setNewInvCatName(e.target.value)} 
                              placeholder="Nombre de categoría (ej. Papelería)" 
                              className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                          <input 
                              type="text" 
                              value={newInvCatPrefix} 
                              onChange={e => setNewInvCatPrefix(e.target.value.toUpperCase())} 
                              placeholder="Prefijo (ej. PAP)" 
                              maxLength={4}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase" 
                          />
                      </div>
                      <button onClick={handleAddInvCategory} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20} /></button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                      {invCategories.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-3 flex-1">
                                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                                      {cat.prefix}
                                  </div>
                                  {editingItem === cat.id ? (
                                      <div className="flex-1 flex gap-2">
                                          <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-[2] border-b border-blue-500 bg-transparent outline-none text-sm font-bold" autoFocus />
                                          <input type="text" value={editValue2} onChange={e => setEditValue2(e.target.value.toUpperCase())} maxLength={4} className="flex-1 border-b border-blue-500 bg-transparent outline-none text-sm font-mono uppercase" />
                                      </div>
                                  ) : (
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                          <span className="text-[10px] text-slate-400">Secuencia actual: {cat.current_sequence}</span>
                                      </div>
                                  )}
                              </div>
                              <div className="flex items-center gap-1">
                                  {editingItem === cat.id ? (
                                      <>
                                          <button onClick={() => saveEditInvCat(cat)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                                          <button onClick={() => setEditingItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                                      </>
                                  ) : (
                                      <>
                                          <button onClick={() => startEditInvCat(cat)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                                          <button onClick={() => requestDelete('inv_cat', cat.id, cat.name)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                      </>
                                  )}
                              </div>
                          </div>
                      ))}
                      {invCategories.length === 0 && <p className="text-center text-xs text-slate-400 italic">No hay categorías de inventario.</p>}
                  </div>
              </div>
          )}

          {/* EVENT CATEGORIES */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
               <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={newEventCatName} 
                      onChange={e => setNewEventCatName(e.target.value)} 
                      placeholder="Nueva categoría de evento..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2">
                       {COLORS.map(c => (
                         <button 
                           key={c.name}
                           onClick={() => setNewEventCatColor(c.name)}
                           className={`w-5 h-5 rounded-full ${c.class} ${newEventCatColor === c.name ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-50 hover:opacity-100'} transition-all`}
                         />
                       ))}
                    </div>
                  </div>
                  <button onClick={handleAddEventCategory} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20} /></button>
               </div>

               <div className="grid grid-cols-1 gap-2">
                  {eventCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                       <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${COLORS.find(c => c.name === cat.color)?.class || 'bg-gray-400'}`}></div>
                          {editingItem === cat.id ? (
                             <div className="flex-1 flex gap-2">
                                <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 border-b border-blue-500 bg-transparent outline-none text-sm font-bold" autoFocus />
                                <div className="flex items-center gap-1">
                                  {COLORS.map(c => (
                                    <button key={c.name} onClick={() => setEditColor(c.name)} className={`w-4 h-4 rounded-full ${c.class} ${editColor === c.name ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-40 hover:opacity-100'}`} />
                                  ))}
                                </div>
                             </div>
                          ) : (
                             <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                          )}
                       </div>
                       <div className="flex items-center gap-1">
                          {editingItem === cat.id ? (
                            <>
                               <button onClick={() => saveEditEventCat(cat)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                               <button onClick={() => setEditingItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditEventCat(cat)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                              <button onClick={() => requestDelete('event_cat', cat.id, cat.name)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                            </>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="flex gap-2">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nueva categoría..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={handleAddCategory} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {formData.resourceCategories.map(cat => {
                  const isOwner = cat.owner_id === currentUser.id || currentUser.role === UserRole.ADMIN;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <Tag size={16} className="text-slate-400" />
                        <div className="flex-1">
                          {editingItem === cat.id ? (
                             <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full border-b border-blue-500 bg-transparent outline-none text-sm font-bold" autoFocus />
                          ) : (
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                               {cat.is_global && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest ring-1 ring-blue-600/10">Global</span>}
                               {categoryCounts[cat.name] > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[10px] font-bold">{categoryCounts[cat.name]} usos</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                         <div className="flex items-center gap-1">
                            {editingItem === cat.id ? (
                              <>
                                <button onClick={() => saveEditCategory(cat)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                                <button onClick={() => setEditingItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditCategory(cat)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                                <button onClick={() => requestDelete('cat', cat.id, cat.name, categoryCounts[cat.name] || 0)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                              </>
                            )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && currentUser.role === UserRole.ADMIN && (
             <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
               {!isUserFormOpen ? (
                 <>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar usuario..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                      </div>
                      <button onClick={startNewUser} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"><UserPlus size={16} /> Nuevo Usuario</button>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar_url} className="w-8 h-8 rounded-lg shadow-sm bg-slate-100" alt="Avatar" />
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">{user.full_name} {user.role === UserRole.ADMIN && <Shield size={12} className="text-blue-500 fill-blue-500" />}</h3>
                            <div className="flex items-center gap-3"><span className="text-[10px] text-slate-400 font-medium">{user.email}</span><span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Building2 size={10} /> {user.department}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' : user.role === UserRole.COORDINATOR ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{user.role}</div>
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                             <button onClick={() => startEditUser(user)} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                             <button onClick={() => requestDelete('user', user.id, user.full_name, 0)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                   </div>
                 </>
               ) : (
                 <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100">
                      <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        {editingUserId ? <Edit3 size={16} /> : <UserPlus size={16} />}
                        {editingUserId ? 'Editar Información' : 'Registrar Usuario'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label><input type="text" className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.full_name || ''} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo</label><input type="email" className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} /></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</label><select className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.department} onChange={e => setUserFormData({...userFormData, department: e.target.value})}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</label><select className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}><option value={UserRole.ADMIN}>Administrador</option><option value={UserRole.COORDINATOR}>Coordinador</option><option value={UserRole.AUXILIAR}>Auxiliar</option></select></div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                      <button onClick={() => { setIsUserFormOpen(false); setEditingUserId(null); }} className="text-xs font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-xl">Cancelar</button>
                      <button onClick={handleSaveUserInternal} className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md">{editingUserId ? 'Guardar Cambios' : 'Registrar'}</button>
                    </div>
                 </div>
               )}
             </div>
          )}
        </div>

        {activeTab !== 'users' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
            <button onClick={handleSaveAll} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"><Save size={16} /> Aplicar Cambios</button>
          </div>
        )}
      </div>
    </div>
  );
};
