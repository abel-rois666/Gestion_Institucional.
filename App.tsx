
import React, { useState, useMemo, useEffect } from 'react';
import { DepartmentEnum, Task, TaskStatus, AppSettings, Resource, Profile, UserRole, ResourceCategory } from './types';
import { MOCK_TASKS } from './constants';
import { ProcessList } from './components/ProcessList';
import { KPIDashboard } from './components/KPIDashboard';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CalendarView } from './components/CalendarView';
import { ChatView } from './components/ChatView';
import { UserManagementModal } from './components/UserManagementModal';
import { generateEfficiencyReport } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Megaphone, 
  DollarSign, 
  Users as UsersIcon, 
  BookOpen, 
  HeartHandshake, 
  Briefcase,
  Bot,
  Menu,
  Building2,
  Plus,
  Settings,
  Folder,
  MessageSquare,
  Calendar,
  List,
  PanelLeftClose,
  ChevronRight,
  X,
  LogOut
} from 'lucide-react';

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  [DepartmentEnum.DIRECTION]: <Building2 size={20} />,
  [DepartmentEnum.SCHOOL_CONTROL]: <GraduationCap size={20} />,
  [DepartmentEnum.PUBLICITY]: <Megaphone size={20} />,
  [DepartmentEnum.FINANCE]: <DollarSign size={20} />,
  [DepartmentEnum.LINKAGE]: <HeartHandshake size={20} />,
  [DepartmentEnum.ACADEMIC]: <BookOpen size={20} />,
  [DepartmentEnum.HR_MATERIALS]: <UsersIcon size={20} />,
  [DepartmentEnum.TUTORING_WELLBEING]: <Briefcase size={20} />,
};

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`w-full flex items-center py-3.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
      isCollapsed ? 'justify-center px-2' : 'px-4 text-left'
    } ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    } rounded-xl mb-1`}
  >
    <span className={`${isCollapsed ? '' : 'mr-3'} shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
    </span>
    <span className={`leading-tight transition-all duration-300 ${
      isCollapsed 
        ? 'w-0 opacity-0 whitespace-nowrap overflow-hidden' 
        : 'w-auto opacity-100'
      }`}>
      {label}
    </span>
    {!isCollapsed && isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
  </button>
);

function App() {
  const [users, setUsers] = useState<Profile[]>([
    { id: 'u-1', full_name: 'Dr. Alejandro García', email: 'director@uni.edu', department: DepartmentEnum.DIRECTION, role: UserRole.ADMIN, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alejandro' },
    { id: 'u-2', full_name: 'Lic. Martha Ruiz', email: 'coordinador@uni.edu', department: DepartmentEnum.ACADEMIC, role: UserRole.COORDINATOR, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martha' },
    { id: 'u-3', full_name: 'Juan Pérez', email: 'auxiliar@uni.edu', department: DepartmentEnum.ACADEMIC, role: UserRole.AUXILIAR, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan' }
  ]);
  
  const [currentUser, setCurrentUser] = useState<Profile>(users[0]);
  const [appConfig, setAppConfig] = useState<AppSettings>({
    appName: 'UniGestor AI',
    logoUrl: '',
    timeZone: 'America/Mexico_City',
    resourceCategories: [
      { id: 'c1', name: 'Formatos Oficiales', is_global: true },
      { id: 'c2', name: 'Normatividad', is_global: true },
      { id: 'c3', name: 'Evidencias', is_global: true }
    ]
  });

  const [departments, setDepartments] = useState<string[]>(Object.values(DepartmentEnum));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<string>('General');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR' | 'CHAT'>('LIST');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);

  const filteredDepartments = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) return departments;
    return [currentUser.department];
  }, [currentUser, departments]);

  const mapDbTaskToTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    department: dbTask.department_name,
    startDate: dbTask.start_date,
    endDate: dbTask.end_date,
    assignee_id: dbTask.assignee_id,
    assignee_name: dbTask.assignee_name,
    isSpecificTask: dbTask.is_specific_task,
    status: dbTask.status as TaskStatus,
    subtasks: dbTask.subtasks ? dbTask.subtasks.map(mapDbTaskToTask) : [],
    resources: dbTask.resources || []
  });

  const fetchTasks = async () => {
    if (!isSupabaseConfigured) {
      if (tasks.length === 0) setTasks(MOCK_TASKS);
      return;
    }
    try {
      const { data, error } = await supabase.from('tasks').select('*, subtasks:tasks(*), resources(*)').is('parent_id', null).order('created_at', { ascending: false });
      if (!error && data) setTasks(data.map(mapDbTaskToTask));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (currentUser.role !== UserRole.ADMIN) result = tasks.filter(t => t.department === currentUser.department);
    if (currentUser.role === UserRole.AUXILIAR) result = result.filter(t => t.assignee_id === currentUser.id);
    if (activeTab !== 'General') result = result.filter(t => t.department === activeTab);
    return result;
  }, [tasks, activeTab, currentUser]);

  const handleSaveTask = async (taskData: Task, parentId?: string) => {
    if (!isSupabaseConfigured) {
      setTasks(prev => {
        if (parentId) {
          return prev.map(t => {
            if (t.id === parentId) return { ...t, subtasks: [...(t.subtasks || []), taskData] };
            return t;
          });
        }
        return [taskData, ...prev];
      });
      return;
    }
    try {
      const dbTask = { 
        id: taskData.id, 
        title: taskData.title, 
        description: taskData.description, 
        department_name: taskData.department, 
        start_date: taskData.startDate, 
        end_date: taskData.endDate, 
        assignee_id: taskData.assignee_id, 
        assignee_name: taskData.assignee_name, 
        is_specific_task: taskData.isSpecificTask, 
        status: taskData.status, 
        parent_id: parentId || null 
      };
      await supabase.from('tasks').upsert(dbTask);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!isSupabaseConfigured) {
      const updateRecursive = (list: Task[]): Task[] => list.map(t => {
        if (t.id === taskId) return { ...t, status: newStatus };
        if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
        return t;
      });
      setTasks(prev => updateRecursive(prev));
      return;
    }
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchTasks();
  };

  const handleTaskUpdate = async (taskId: string, field: keyof Task, value: any) => {
    if (!isSupabaseConfigured) {
      const updateRecursive = (list: Task[]): Task[] => list.map(t => {
        if (t.id === taskId) return { ...t, [field]: value };
        if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
        return t;
      });
      setTasks(prev => updateRecursive(prev));
      return;
    }
    const dbField = field === 'startDate' ? 'start_date' : field === 'endDate' ? 'end_date' : field;
    await supabase.from('tasks').update({ [dbField]: value }).eq('id', taskId);
    fetchTasks();
  };

  const handleUpdateTaskFromModal = async (updatedTask: Task) => {
    if (!isSupabaseConfigured) {
      const updateRecursive = (list: Task[]): Task[] => list.map(t => {
        if (t.id === updatedTask.id) return updatedTask;
        if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
        return t;
      });
      setTasks(prev => updateRecursive(prev));
      return;
    }
    await supabase.from('tasks').update({
      title: updatedTask.title,
      description: updatedTask.description,
      start_date: updatedTask.startDate,
      end_date: updatedTask.endDate,
      assignee_id: updatedTask.assignee_id,
      assignee_name: updatedTask.assignee_name,
      status: updatedTask.status
    }).eq('id', updatedTask.id);
    fetchTasks();
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (task: Task) => setTaskToView(task);

  const handleGenerateReport = async () => {
    setIsGenerating(true); setAiReport(null);
    try {
      const report = await generateEfficiencyReport(activeTab === 'General' ? 'GENERAL' : activeTab, filteredTasks);
      setAiReport(report);
    } catch (e) { setAiReport("Error."); } finally { setIsGenerating(false); }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* OVERLAY PARA MÓVIL */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 lg:translate-x-0 lg:static 
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
        w-[280px] lg:w-auto flex flex-col`}>
        
        <div className="h-16 flex items-center border-b border-slate-100 px-6 justify-between shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                 <span className="text-white font-bold text-lg">U</span>
            </div>
            <div className={`ml-3 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              <span className="text-base font-bold text-slate-800 truncate block leading-tight">{appConfig.appName}</span>
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Enterprise</span>
            </div>
          </div>
          
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex text-slate-400 hover:text-blue-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all">
            <PanelLeftClose size={20} className={isCollapsed ? 'rotate-180' : ''} />
          </button>

          {/* Botón cerrar para móvil */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 custom-scrollbar overflow-x-hidden">
          <NavItem id="General" label="Vista General" icon={<LayoutDashboard size={20} />} isActive={activeTab === 'General'} onClick={() => { setActiveTab('General'); setIsSidebarOpen(false); }} isCollapsed={isCollapsed} />
          <NavItem id="Chat" label="Chat Interno" icon={<MessageSquare size={20} />} isActive={viewMode === 'CHAT'} onClick={() => { setViewMode('CHAT'); setIsSidebarOpen(false); }} isCollapsed={isCollapsed} />
          
          <div className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8 ${isCollapsed ? 'hidden' : ''}`}>Mis Áreas</div>
          
          <div className="space-y-1">
            {filteredDepartments.map(dept => (
              <NavItem 
                key={dept} 
                id={dept} 
                label={dept} 
                icon={DEFAULT_ICONS[dept] || <Folder size={20} />} 
                isActive={activeTab === dept && viewMode !== 'CHAT'} 
                onClick={() => { setActiveTab(dept); setViewMode('LIST'); setIsSidebarOpen(false); }} 
                isCollapsed={isCollapsed} 
              />
            ))}
          </div>

          {currentUser.role === UserRole.ADMIN && (
            <>
              <div className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8 ${isCollapsed ? 'hidden' : ''}`}>Sistema</div>
              <NavItem id="Users" label="Gestión de Usuarios" icon={<UsersIcon size={20} />} isActive={false} onClick={() => { setIsUserMgmtOpen(true); setIsSidebarOpen(false); }} isCollapsed={isCollapsed} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
           {currentUser.role !== UserRole.AUXILIAR && (
             <button onClick={() => setIsSettingsOpen(true)} className={`flex items-center text-slate-600 hover:text-blue-600 p-3 hover:bg-white rounded-xl transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}>
               <Settings size={20} />
               {!isCollapsed && <span className="ml-3 text-sm font-bold">Configuración</span>}
             </button>
           )}
           
           <div className={`flex items-center p-2 bg-white rounded-2xl shadow-sm border border-slate-100 ${isCollapsed ? 'justify-center p-1' : ''}`}>
              <div className="relative shrink-0">
                <img 
                  src={currentUser.avatar_url} 
                  className="w-10 h-10 rounded-xl cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
                  alt="Perfil" 
                  onClick={() => {
                    const nextIdx = (users.indexOf(currentUser) + 1) % users.length;
                    setCurrentUser(users[nextIdx]);
                  }} 
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{currentUser.full_name}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">{currentUser.role}</p>
                </div>
              )}
              {!isCollapsed && (
                <button className="ml-auto p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all">
                  <LogOut size={16} />
                </button>
              )}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl mr-2 shrink-0"><Menu size={24} /></button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
               {viewMode === 'CHAT' ? 'Comunicación Interna' : (activeTab === 'General' ? 'Panel de Control' : activeTab)}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser.role !== UserRole.AUXILIAR && viewMode !== 'CHAT' && (
               <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                 <Plus size={18} className="sm:mr-2" /> <span className="hidden sm:inline">Nuevo Registro</span>
               </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
           {viewMode === 'CHAT' ? <ChatView currentUser={currentUser} /> : (
             <>
               <KPIDashboard tasks={filteredTasks} />
               
               <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <Bot size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Analista UniGestor AI</h2>
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Generando Reportes</p>
                    </div>
                  </div>
                  <button onClick={handleGenerateReport} disabled={isGenerating} className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${isGenerating ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200'}`}>
                    {isGenerating ? 'Analizando...' : 'Análisis Operativo'}
                  </button>
                </div>
                {aiReport && <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 text-slate-800 text-sm leading-relaxed whitespace-pre-line animate-in fade-in duration-500 prose prose-slate prose-sm max-w-none">{aiReport}</div>}
              </div>

               <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-800">Gestión Operativa</h2>
                  <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200 self-start sm:self-auto">
                    <button onClick={() => setViewMode('LIST')} className={`flex items-center px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={14} className="mr-2" /> Lista</button>
                    <button onClick={() => setViewMode('CALENDAR')} className={`flex items-center px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calendar size={14} className="mr-2" /> Calendario</button>
                  </div>
               </div>
               
               {viewMode === 'LIST' ? (
                 <ProcessList 
                   tasks={filteredTasks} 
                   onStatusChange={handleStatusChange} 
                   onTaskUpdate={handleTaskUpdate} 
                   onEdit={handleEditClick} 
                   onView={handleViewClick} 
                   currentUser={currentUser} 
                   showDepartment={activeTab === 'General'}
                 />
               ) : <CalendarView tasks={filteredTasks} onView={handleViewClick} />}
             </>
           )}
        </div>
      </main>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} currentDepartment={activeTab} existingTasks={tasks} availableDepartments={filteredDepartments} users={users} />
      <EditTaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateTaskFromModal} task={taskToEdit} users={users} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={appConfig} onSaveSettings={setAppConfig} departments={departments} onUpdateDepartments={setDepartments} departmentCounts={{}} currentUser={currentUser} />
      <TaskDetailModal isOpen={!!taskToView} onClose={() => setTaskToView(null)} task={taskToView} onAddResource={() => {}} onDeleteResource={() => {}} onReorderResources={() => {}} availableCategories={appConfig.resourceCategories.map(c => c.name)} />
      <UserManagementModal isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} users={users} onSaveUser={u => setUsers([...users, u])} onDeleteUser={id => setUsers(users.filter(u => u.id !== id))} departments={departments} />
    </div>
  );
}

export default App;
