
import React, { useState } from 'react';
import { Profile, UserRole, DepartmentEnum } from '../types';
import { X, UserPlus, Shield, Trash2, Mail, Building2, Search, CheckCircle2 } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);
  
  const [newUser, setNewUser] = useState<Partial<Profile>>({
    role: UserRole.AUXILIAR,
    department: DepartmentEnum.ACADEMIC
  });

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!newUser.full_name || !newUser.email) return;
    onSaveUser({
      ...newUser,
      id: crypto.randomUUID(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.full_name}`
    } as Profile);
    setIsAdding(false);
    setNewUser({ role: UserRole.AUXILIAR, department: DepartmentEnum.ACADEMIC });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold">Gestión de Personal y Roles</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
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
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <UserPlus size={18} /> Nuevo Usuario
            </button>
          </div>

          {isAdding && (
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  className="bg-white border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500"
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                />
                <input 
                  type="email" 
                  placeholder="Correo electrónico" 
                  className="bg-white border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500"
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
                <select 
                  className="bg-white border-none rounded-lg text-sm p-2"
                  value={newUser.department}
                  onChange={e => setNewUser({...newUser, department: e.target.value})}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  className="bg-white border-none rounded-lg text-sm p-2"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.COORDINATOR}>Coordinador</option>
                  <option value={UserRole.AUXILIAR}>Auxiliar</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="text-xs font-bold text-slate-500 px-3">Cancelar</button>
                <button onClick={handleAdd} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg">Guardar Usuario</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <img src={user.avatar_url} className="w-10 h-10 rounded-xl shadow-sm" alt="Avatar" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{user.full_name}</h3>
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
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600' : 
                    user.role === UserRole.COORDINATOR ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </div>
                  <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
