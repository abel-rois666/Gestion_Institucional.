import React, { useState, useMemo } from 'react';
import { DepartmentEnum, Task, TaskStatus, AppSettings, Resource } from './types';
import { MOCK_TASKS } from './constants';
import { ProcessList } from './components/ProcessList';
import { KPIDashboard } from './components/KPIDashboard';
import { AddTaskModal } from './components/AddTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CalendarView } from './components/CalendarView'; // Imported CalendarView
import { generateEfficiencyReport } from './services/geminiService';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Megaphone, 
  DollarSign, 
  Users, 
  BookOpen, 
  HeartHandshake, 
  Briefcase,
  Bot,
  Menu,
  Building2,
  Plus,
  Settings,
  Folder,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  List
} from 'lucide-react';

// Default Icon mapping
const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  [DepartmentEnum.DIRECTION]: <Building2 size={20} />,
  [DepartmentEnum.SCHOOL_CONTROL]: <GraduationCap size={20} />,
  [DepartmentEnum.PUBLICITY]: <Megaphone size={20} />,
  [DepartmentEnum.FINANCE]: <DollarSign size={20} />,
  [DepartmentEnum.LINKAGE]: <HeartHandshake size={20} />,
  [DepartmentEnum.ACADEMIC]: <BookOpen size={20} />,
  [DepartmentEnum.HR_MATERIALS]: <Users size={20} />,
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
    className={`w-full flex items-center py-3 text-sm font-medium transition-all duration-200 ${
      isCollapsed ? 'justify-center px-2' : 'px-4 text-left'
    } ${
      isActive
        ? `bg-blue-50 text-blue-700 ${!isCollapsed ? 'border-r-4 border-blue-600' : ''}`
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <span className={`${isCollapsed ? '' : 'mr-3'} shrink-0 transition-transform duration-200 ${isActive && isCollapsed ? 'scale-110 text-blue-600' : ''}`}>
      {icon}
    </span>
    <span className={`leading-tight transition-all duration-200 ${
      isCollapsed 
        ? 'w-0 opacity-0 whitespace-nowrap overflow-hidden' 
        : 'w-auto opacity-100'
      }`}>
      {label}
    </span>
  </button>
);

function App() {
  // --- STATE ---
  
  // App Configuration
  const [appConfig, setAppConfig] = useState<AppSettings>({
    appName: 'UniGestor AI',
    logoUrl: '', // Empty defaults to generic icon
    timeZone: 'America/Mexico_City',
    resourceCategories: [
      'Formatos Oficiales',
      'Normatividad y Reglamentos',
      'Evidencias',
      'Material Didáctico',
      'Planeación',
      'Minutas',
      'Otros'
    ]
  });

  // Departments List (Initialized from Enum values)
  const [departments, setDepartments] = useState<string[]>(Object.values(DepartmentEnum));

  // Tasks Data
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  
  // UI State
  const [activeTab, setActiveTab] = useState<string>('General');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST'); // New View Mode State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapse state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null); // For Details Modal

  // --- LOGIC ---

  // Filter tasks based on active selection
  const filteredTasks = useMemo(() => {
    if (activeTab === 'General') return tasks;
    return tasks.filter(t => t.department === activeTab);
  }, [activeTab, tasks]);

  // Calculate task counts per department (for safe deletion check)
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    departments.forEach(d => counts[d] = 0);
    
    const countRecursive = (list: Task[]) => {
      list.forEach(t => {
        counts[t.department] = (counts[t.department] || 0) + 1;
        if (t.subtasks) countRecursive(t.subtasks);
      });
    };
    countRecursive(tasks);
    return counts;
  }, [tasks, departments]);

  // Helper: Recursive update
  const updateTaskRecursively = (currentTasks: Task[], updatedTask: Task): Task[] => {
    return currentTasks.map(t => {
      if (t.id === updatedTask.id) {
        return updatedTask;
      }
      if (t.subtasks && t.subtasks.length > 0) {
        return { ...t, subtasks: updateTaskRecursively(t.subtasks, updatedTask) };
      }
      return t;
    });
  };

  // Helper: Recursive update just for status
  const updateStatusRecursively = (currentTasks: Task[], taskId: string, newStatus: TaskStatus): Task[] => {
    return currentTasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      if (t.subtasks && t.subtasks.length > 0) {
        return { ...t, subtasks: updateStatusRecursively(t.subtasks, taskId, newStatus) };
      }
      return t;
    });
  };

  // Helper: Recursive update for ANY field
  const updateFieldRecursively = (currentTasks: Task[], taskId: string, field: keyof Task, value: any): Task[] => {
    return currentTasks.map(t => {
      if (t.id === taskId) {
        return { ...t, [field]: value };
      }
      if (t.subtasks && t.subtasks.length > 0) {
        return { ...t, subtasks: updateFieldRecursively(t.subtasks, taskId, field, value) };
      }
      return t;
    });
  };

  // Handle Save (Create or Update)
  const handleSaveTask = (taskData: Task, parentId?: string) => {
    if (taskToEdit) {
      // UPDATE Existing
      setTasks(prev => updateTaskRecursively(prev, taskData));
    } else {
      // CREATE New
      if (parentId) {
        // Add as subtask
        setTasks(prevTasks => prevTasks.map(t => {
          if (t.id === parentId) {
            return {
              ...t,
              subtasks: [...(t.subtasks || []), taskData]
            };
          }
          return t;
        }));
      } else {
        // Add as root task
        setTasks(prevTasks => [taskData, ...prevTasks]);
      }
    }
    setTaskToEdit(null);
  };

  // Handle Status Change from Table
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => updateStatusRecursively(prev, taskId, newStatus));
  };

  // Handle Generic Field Change from Table (Inline Editing)
  const handleTaskUpdate = (taskId: string, field: keyof Task, value: any) => {
    setTasks(prev => updateFieldRecursively(prev, taskId, field, value));
  };

  // Handle Edit Click
  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Handle View Click
  const handleViewClick = (task: Task) => {
    setTaskToView(task);
  };

  // Resource Management Handlers
  const handleAddResource = (taskId: string, resource: Resource) => {
    const updateResourcesRec = (list: Task[]): Task[] => {
      return list.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, resources: [...(t.resources || []), resource] };
          if (taskToView?.id === taskId) setTaskToView(updated); // Update modal view
          return updated;
        }
        if (t.subtasks) return { ...t, subtasks: updateResourcesRec(t.subtasks) };
        return t;
      });
    };
    setTasks(prev => updateResourcesRec(prev));
  };

  const handleDeleteResource = (taskId: string, resourceId: string) => {
    const deleteRec = (list: Task[]): Task[] => {
      return list.map(t => {
        if (t.id === taskId) {
          const updated = { 
            ...t, 
            resources: t.resources?.filter(r => r.id !== resourceId) 
          };
          if (taskToView?.id === taskId) setTaskToView(updated); // Update modal view
          return updated;
        }
        if (t.subtasks) return { ...t, subtasks: deleteRec(t.subtasks) };
        return t;
      });
    };
    setTasks(prev => deleteRec(prev));
  };

  // Handle Reorder Resources
  const handleReorderResources = (taskId: string, newResources: Resource[]) => {
    const updateRec = (list: Task[]): Task[] => {
      return list.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, resources: newResources };
          if (taskToView?.id === taskId) setTaskToView(updated); // Update modal view to reflect order immediately
          return updated;
        }
        if (t.subtasks) return { ...t, subtasks: updateRec(t.subtasks) };
        return t;
      });
    };
    setTasks(prev => updateRec(prev));
  };

  // Update Departments List & Rename Tasks if needed
  const handleUpdateDepartments = (newList: string[], oldName?: string, newName?: string) => {
    setDepartments(newList);
    
    if (oldName && newName) {
      // We need to rename the department in all tasks
      const renameRecursive = (list: Task[]): Task[] => {
        return list.map(t => ({
          ...t,
          department: t.department === oldName ? newName : t.department,
          subtasks: t.subtasks ? renameRecursive(t.subtasks) : undefined
        }));
      };
      setTasks(prev => renameRecursive(prev));

      // Also update active tab if we were viewing that department
      if (activeTab === oldName) {
        setActiveTab(newName);
      }
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setAiReport(null);
    try {
      const dept = activeTab === 'General' ? 'GENERAL' : activeTab;
      const report = await generateEfficiencyReport(dept, filteredTasks);
      setAiReport(report);
    } catch (e) {
      setAiReport("Error al generar el reporte.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    setAiReport(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}>
        {/* App Logo/Name */}
        <div className={`h-16 flex items-center border-b border-gray-100 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
          <div className="flex items-center overflow-hidden">
            {appConfig.logoUrl ? (
              <img src={appConfig.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                 <span className="text-white font-bold text-lg">{appConfig.appName.charAt(0)}</span>
              </div>
            )}
            <span className={`ml-3 text-lg font-bold text-gray-800 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`} title={appConfig.appName}>
              {appConfig.appName}
            </span>
          </div>
          
          {/* Desktop Collapse Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg p-1 transition-colors ${isCollapsed ? 'absolute -right-3 bg-white border border-gray-200 shadow-sm z-50' : ''}`}
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto pb-4 custom-scrollbar overflow-x-hidden">
          <div className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
            Panel Principal
          </div>
          <NavItem 
            id="General" 
            label="Vista General" 
            icon={<LayoutDashboard size={20} />} 
            isActive={activeTab === 'General'}
            onClick={() => handleNavClick('General')}
            isCollapsed={isCollapsed}
          />

          <div className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
            Departamentos
          </div>
          <div className="space-y-1">
            {departments.map((dept) => (
              <NavItem 
                key={dept} 
                id={dept} 
                label={dept} 
                icon={DEFAULT_ICONS[dept] || <Folder size={20} />} 
                isActive={activeTab === dept}
                onClick={() => handleNavClick(dept)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className={`flex items-center text-gray-600 hover:text-blue-600 transition-colors w-full ${isCollapsed ? 'justify-center' : ''}`}
             title={isCollapsed ? "Configuración" : undefined}
           >
             <Settings size={20} />
             <span className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
               Configuración
             </span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4 shrink-0"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-bold text-gray-800 truncate">{activeTab === 'General' ? 'Panel de Control' : activeTab}</h1>
              <span className="text-xs text-gray-500 truncate hidden sm:block">
                {appConfig.appName} • {appConfig.timeZone.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
            >
              <Plus size={18} className="mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Proceso / Tarea</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 w-full">
          
          {/* KPI Section */}
          <KPIDashboard tasks={filteredTasks} />

          {/* AI Report Section */}
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Bot className="text-purple-600 shrink-0" />
                <h2 className="text-lg font-semibold text-gray-800">Asistente de Eficiencia (Gemini AI)</h2>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all whitespace-nowrap
                  ${isGenerating ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'}
                `}
              >
                {isGenerating ? 'Analizando...' : 'Generar Reporte'}
              </button>
            </div>

            {aiReport && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 text-gray-800 text-sm leading-relaxed whitespace-pre-line animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
                {aiReport}
              </div>
            )}
            {!aiReport && !isGenerating && (
              <p className="text-gray-500 text-sm">
                Solicita a la IA que analice los procesos actuales para identificar cuellos de botella y generar recomendaciones estratégicas.
              </p>
            )}
          </div>

          {/* Task List / Calendar Toggle & Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {activeTab === 'General' ? 'Todos los Procesos' : `Procesos de ${activeTab}`}
              </h2>
              
              {/* View Toggle */}
              <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 self-start md:self-auto">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List size={16} className="mr-2" />
                  Lista
                </button>
                <button 
                  onClick={() => setViewMode('CALENDAR')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'CALENDAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Calendar size={16} className="mr-2" />
                  Calendario
                </button>
              </div>
            </div>
            
            {/* Conditional Rendering based on View Mode */}
            {viewMode === 'LIST' ? (
              <ProcessList 
                tasks={filteredTasks} 
                onStatusChange={handleStatusChange}
                onTaskUpdate={handleTaskUpdate}
                onEdit={handleEditClick}
                onView={handleViewClick}
              />
            ) : (
              <CalendarView 
                tasks={filteredTasks}
                onView={handleViewClick}
              />
            )}
          </div>

        </div>
      </main>

      {/* Add/Edit Task Modal */}
      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }} 
        onSave={handleSaveTask}
        currentDepartment={activeTab}
        existingTasks={tasks}
        taskToEdit={taskToEdit}
        availableDepartments={departments}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appConfig}
        onSaveSettings={setAppConfig}
        departments={departments}
        onUpdateDepartments={handleUpdateDepartments}
        departmentCounts={departmentCounts}
      />

      {/* Task Details Modal */}
      <TaskDetailModal 
        isOpen={!!taskToView}
        onClose={() => setTaskToView(null)}
        task={taskToView}
        onAddResource={handleAddResource}
        onDeleteResource={handleDeleteResource}
        onReorderResources={handleReorderResources}
        availableCategories={appConfig.resourceCategories}
      />
    </div>
  );
}

export default App;