
import React, { useState } from 'react';
import { Profile, UserRole, DepartmentEnum } from '../types';
import { X, UserPlus, Shield, Trash2, Mail, Building2, Search, CheckCircle2, Edit3, Save } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Profile[];
  onSaveUser: (user: Profile) => void;
  onDeleteUser: (userId: string) => void;
  departments: string[];
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onSaveUser,
  onDeleteUser,
  departments
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Profile>>({
    role: UserRole.AUXILIAR,
    department: DepartmentEnum.ACADEMIC
  });

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.full_name || !formData.email) return;

    if (editingId) {
      // Editar
      const updatedUser = users.find(u => u.id === editingId);
      if (updatedUser) {
        onSaveUser({
          ...updatedUser,
          full_name: formData.full_name,
          email: formData.email,
          department: formData.department || updatedUser.department,
          role: formData.role || updatedUser.role
        });
      }
    } else {
      // Crear Nuevo
      onSaveUser({
        id: crypto.randomUUID(),
        full_name: formData.full_name,
        email: formData.email,
        department: formData.department || DepartmentEnum.ACADEMIC,
        role: formData.role || UserRole.AUXILIAR,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`
      });
    }
    
    resetForm();
  };

  const startEdit = (user: Profile) => {
    setEditingId(user.id);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      role: user.role
    });
    setIsFormOpen(true);
  };

  const startNew = () => {
    setEditingId(null);
    setFormData({ role: UserRole.AUXILIAR, department: DepartmentEnum.ACADEMIC });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ role: UserRole.AUXILIAR, department: DepartmentEnum.ACADEMIC });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold">Gestión de Personal y Roles</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {!isFormOpen && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o correo..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={startNew}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <UserPlus size={18} /> Nuevo Usuario
              </button>
            </div>
          )}

          {isFormOpen && (
            <div className="mb-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  {editingId ? <Edit3 size={16} /> : <UserPlus size={16} />}
                  {editingId ? 'Editar Información de Usuario' : 'Registrar Nuevo Usuario'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Juan Pérez" 
                    className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.full_name || ''}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                  <input 
                    type="email" 
                    placeholder="Ej. usuario@uni.edu" 
                    className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</label>
                   <select 
                    className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol de Sistema</label>
                   <select 
                    className="w-full bg-white border border-slate-200 rounded-xl text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.ADMIN}>Administrador (Acceso Total)</option>
                    <option value={UserRole.COORDINATOR}>Coordinador (Gestión de Área)</option>
                    <option value={UserRole.AUXILIAR}>Auxiliar (Solo Lectura/Tareas Propias)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={resetForm} className="text-xs font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95">
                  <Save size={14} />
                  {editingId ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.map(user => (
              <div key={user.id} className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all ${editingId === user.id ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg' : 'border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
                <div className="flex items-center gap-4">
                  <img src={user.avatar_url} className="w-10 h-10 rounded-xl shadow-sm bg-slate-100" alt="Avatar" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {user.full_name}
                      {user.role === UserRole.ADMIN && <Shield size={12} className="text-blue-500 fill-blue-500" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Mail size={12} /> {user.email}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Building2 size={12} /> {user.department}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' : 
                    user.role === UserRole.COORDINATOR ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </div>
                  
                  <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                    <button 
                      onClick={() => startEdit(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar usuario"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                          onDeleteUser(user.id);
                        }
                      }} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">
                No se encontraron usuarios con ese criterio.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
