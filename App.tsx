
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DepartmentEnum, Task, TaskStatus, AppSettings, Resource, Profile, UserRole, ResourceCategory, CalendarEvent, EventCategory } from './types';
import { MOCK_TASKS } from './constants';
import { ProcessList } from './components/ProcessList';
import { KPIDashboard } from './components/KPIDashboard';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CalendarView } from './components/CalendarView';
import { ChatView } from './components/ChatView';
import { WelcomeSummaryModal } from './components/WelcomeSummaryModal';
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
  LogOut,
  Wifi,
  WifiOff,
  Database,
  Bell,
  Check,
  Clock
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
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, isActive, onClick, isCollapsed, badge }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`w-full flex items-center py-3.5 text-sm font-semibold transition-all duration-200 active:scale-95 relative group ${
      isCollapsed ? 'justify-center px-2' : 'px-4 text-left'
    } ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    } rounded-xl mb-1`}
  >
    <span className={`${isCollapsed ? '' : 'mr-3'} shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
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
    
    {/* Badge Logic */}
    {badge && badge > 0 ? (
      <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-3'} bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse`}>
        {badge > 99 ? '99+' : badge}
      </span>
    ) : null}
  </button>
);

// Sonido de notificación simple usando el oscilador del navegador
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("No se pudo reproducir el sonido:", e);
  }
};

// Interface para notificaciones detalladas
interface NotificationItem {
  id: string; // message id
  sender_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

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
    ],
    departmentConfigs: {
       [DepartmentEnum.LINKAGE]: { enableEvents: true },
       [DepartmentEnum.PUBLICITY]: { enableEvents: true },
       [DepartmentEnum.FINANCE]: { enableEvents: true },
       [DepartmentEnum.ACADEMIC]: { enableEvents: true },
       [DepartmentEnum.TUTORING_WELLBEING]: { enableEvents: true },
       [DepartmentEnum.DIRECTION]: { enableEvents: true },
    }
  });

  const [departments, setDepartments] = useState<string[]>(Object.values(DepartmentEnum));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]); // New State
  
  const [activeTab, setActiveTab] = useState<string>('General');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR' | 'CHAT'>('LIST');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // --- WELCOME MODAL STATE ---
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [welcomeOverdueTasks, setWelcomeOverdueTasks] = useState<Task[]>([]);
  const [welcomeUpcomingTasks, setWelcomeUpcomingTasks] = useState<Task[]>([]);

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const [toastNotification, setToastNotification] = useState<{ visible: boolean, title: string, message: string, avatar?: string } | null>(null);

  const unreadCount = notifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAllTasks = (taskList: Task[]): Task[] => {
    let all: Task[] = [];
    taskList.forEach(t => {
      all.push(t);
      if (t.subtasks && t.subtasks.length > 0) {
        all = all.concat(getAllTasks(t.subtasks));
      }
    });
    return all;
  };

  useEffect(() => {
    if (isLoadingTasks) return;

    const allFlatTasks = getAllTasks(tasks);
    const myTasks = allFlatTasks.filter(t => {
       if (currentUser.role === UserRole.AUXILIAR) {
          return t.assignee_id === currentUser.id;
       }
       return t.department === currentUser.department || t.assignee_id === currentUser.id;
    });

    const now = new Date();
    now.setHours(0,0,0,0);

    const overdue: Task[] = [];
    const upcoming: Task[] = [];

    myTasks.forEach(task => {
       if (task.status === TaskStatus.COMPLETED) return;
       if (!task.endDate) return;

       const [y, m, d] = task.endDate.split('-').map(Number);
       const endDate = new Date(y, m - 1, d); 
       
       const diffTime = endDate.getTime() - now.getTime();
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

       if (diffDays < 0) {
         overdue.push(task);
       } else if (diffDays >= 0 && diffDays <= 4) {
         upcoming.push(task);
       }
    });

    setWelcomeOverdueTasks(overdue);
    setWelcomeUpcomingTasks(upcoming);

    if (overdue.length > 0 || upcoming.length > 0) {
      setIsWelcomeModalOpen(true);
    }
  }, [tasks, isLoadingTasks, currentUser]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = getAllTasks(tasks);
    all.forEach(t => {
      counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = getAllTasks(tasks);
    all.forEach(t => {
      t.resources?.forEach(r => {
        if (r.category) {
          counts[r.category] = (counts[r.category] || 0) + 1;
        }
      });
    });
    return counts;
  }, [tasks]);

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
    resources: dbTask.resources || [],
    reports: dbTask.reports || []
  });

  const fetchTasks = async () => {
    if (!isSupabaseConfigured) {
      if (tasks.length === 0) setTasks(MOCK_TASKS);
      return;
    }
    setIsLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, subtasks:tasks(*), resources(*), reports(*)')
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTasks(data.map(mapDbTaskToTask));
      } else {
        console.error("Error fetching tasks:", error);
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchEvents = async () => {
     if (!isSupabaseConfigured) return;
     try {
       const { data, error } = await supabase.from('calendar_events').select('*');
       if (!error && data) setEvents(data);
     } catch(e) { console.error("Error fetching events", e); }
  };

  const fetchEventCategories = async () => {
    if (!isSupabaseConfigured) {
        // Fallback Mock Categories
        if(eventCategories.length === 0) {
            setEventCategories([
                { id: '1', name: 'Académico', color: 'blue' },
                { id: '2', name: 'Festivo', color: 'red' },
                { id: '3', name: 'Reunión', color: 'purple' },
            ]);
        }
        return;
    }
    try {
      const { data, error } = await supabase.from('event_categories').select('*');
      if (!error && data) setEventCategories(data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { 
      fetchTasks(); 
      fetchEvents(); 
      fetchEventCategories();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (viewMode === 'CHAT') {
      setNotifications([]);
    }

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new;
          if (newMessage.user_id === currentUser.id) return;

          if (viewMode !== 'CHAT') {
            playNotificationSound();
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMessage.user_id)
              .single();

            const senderName = sender?.full_name || 'Alguien';
            const senderAvatar = sender?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}`;
            
            const newItem: NotificationItem = {
              id: newMessage.id,
              sender_name: senderName,
              avatar_url: senderAvatar,
              content: newMessage.content,
              created_at: newMessage.created_at
            };
            
            setNotifications(prev => [newItem, ...prev]);

            setToastNotification({
              visible: true,
              title: `Nuevo mensaje de ${senderName}`,
              message: newMessage.content,
              avatar: senderAvatar
            });

            setTimeout(() => {
              setToastNotification(null);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, viewMode]);


  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (currentUser.role !== UserRole.ADMIN) result = tasks.filter(t => t.department === currentUser.department);
    if (currentUser.role === UserRole.AUXILIAR) result = result.filter(t => t.assignee_id === currentUser.id);
    if (activeTab !== 'General') result = result.filter(t => t.department === activeTab);
    return result;
  }, [tasks, activeTab, currentUser]);

  const filteredEvents = useMemo(() => {
     let result = events;
     if (activeTab !== 'General') {
         // Show global events + department specific events
         result = result.filter(e => e.is_global || e.department === activeTab);
     }
     return result;
  }, [events, activeTab]);

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

  const handleSaveEvent = async (event: Partial<CalendarEvent>) => {
      const newEvent = { ...event, created_by: currentUser.id };
      
      if (!isSupabaseConfigured) {
          setEvents(prev => [...prev, { ...newEvent, id: crypto.randomUUID() } as CalendarEvent]);
          return;
      }

      try {
          const { error } = await supabase.from('calendar_events').insert(newEvent);
          if (error) throw error;
          fetchEvents();
      } catch (e) {
          alert("Error al guardar evento.");
      }
  };

  const handleDeleteEvent = async (id: string) => {
      if(!confirm("¿Seguro que deseas eliminar este evento?")) return;

      if (!isSupabaseConfigured) {
          setEvents(prev => prev.filter(e => e.id !== id));
          return;
      }

      try {
          const { error } = await supabase.from('calendar_events').delete().eq('id', id);
          if (error) throw error;
          fetchEvents();
      } catch(e) {
          alert("Error al eliminar evento.");
      }
  }

  // --- Event Category Handlers ---
  const handleSaveEventCategory = async (category: EventCategory) => {
    if (!isSupabaseConfigured) {
        setEventCategories(prev => {
            const exists = prev.find(c => c.id === category.id);
            if(exists) return prev.map(c => c.id === category.id ? category : c);
            return [...prev, category];
        });
        return;
    }
    try {
        const { error } = await supabase.from('event_categories').upsert(category);
        if(error) throw error;
        fetchEventCategories();
    } catch(e) {
        console.error(e);
        alert("Error al guardar categoría de evento.");
    }
  };

  const handleDeleteEventCategory = async (id: string) => {
      if(!confirm("¿Eliminar categoría? Los eventos asociados perderán su clasificación.")) return;
      
      if (!isSupabaseConfigured) {
          setEventCategories(prev => prev.filter(c => c.id !== id));
          return;
      }
      try {
          const { error } = await supabase.from('event_categories').delete().eq('id', id);
          if(error) throw error;
          fetchEventCategories();
      } catch(e) {
          console.error(e);
          alert("Error al eliminar categoría.");
      }
  };

  // ... (Rest of existing handlers: handleStatusChange, etc. - kept as is)
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

  const handleRenameDepartment = (oldName: string, newName: string) => {
    setDepartments(prev => prev.map(d => d === oldName ? newName : d));
    const updateTasksRecursive = (list: Task[]): Task[] => list.map(t => {
      const updatedT = t.department === oldName ? { ...t, department: newName } : t;
      if (updatedT.subtasks) {
        updatedT.subtasks = updateTasksRecursive(updatedT.subtasks);
      }
      return updatedT;
    });
    setTasks(prev => updateTasksRecursive(prev));
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    setAppConfig(prev => ({
      ...prev,
      resourceCategories: prev.resourceCategories.map(c => c.name === oldName ? { ...c, name: newName } : c)
    }));
    const updateTasksRecursive = (list: Task[]): Task[] => list.map(t => {
      const updatedResources = t.resources?.map(r => r.category === oldName ? { ...r, category: newName } : r);
      let updatedT = { ...t, resources: updatedResources };
      if (updatedT.subtasks) {
        updatedT.subtasks = updateTasksRecursive(updatedT.subtasks);
      }
      return updatedT;
    });
    setTasks(prev => updateTasksRecursive(prev));
  };

  const handleAddResource = async (taskId: string, resource: Resource) => {
    if (taskToView && taskToView.id === taskId) {
       setTaskToView(prev => prev ? { ...prev, resources: [...(prev.resources || []), resource] } : null);
    }
    if (!isSupabaseConfigured) {
      setTasks(prev => {
        const updateRecursive = (list: Task[]): Task[] => list.map(t => {
            if (t.id === taskId) return { ...t, resources: [...(t.resources || []), resource] };
            if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
            return t;
        });
        return updateRecursive(prev);
      });
      return;
    }
    try {
      const { error } = await supabase.from('resources').insert({
        id: resource.id,
        task_id: taskId,
        name: resource.name,
        url: resource.url,
        type: resource.type,
        category: resource.category
      });
      if (error) throw error;
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Error al guardar el recurso en la base de datos.");
    }
  };

  const handleEditResource = async (taskId: string, updatedResource: Resource) => {
    if (taskToView && taskToView.id === taskId) {
       setTaskToView(prev => prev ? { ...prev, resources: prev.resources?.map(r => r.id === updatedResource.id ? updatedResource : r) } : null);
    }
    if (!isSupabaseConfigured) {
      setTasks(prev => {
        const updateRecursive = (list: Task[]): Task[] => list.map(t => {
            if (t.id === taskId) return { ...t, resources: t.resources?.map(r => r.id === updatedResource.id ? updatedResource : r) };
            if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
            return t;
        });
        return updateRecursive(prev);
      });
      return;
    }
    try {
      const { error } = await supabase.from('resources').update({
        name: updatedResource.name,
        url: updatedResource.url,
        type: updatedResource.type,
        category: updatedResource.category
      }).eq('id', updatedResource.id);
      if (error) throw error;
      fetchTasks(); 
    } catch (e) {
      console.error(e);
      alert("Error al actualizar el recurso.");
    }
  };

  const handleDeleteResource = async (taskId: string, resourceId: string) => {
     if (taskToView && taskToView.id === taskId) {
        setTaskToView(prev => prev ? { ...prev, resources: prev.resources?.filter(r => r.id !== resourceId) } : null);
     }
     if (!isSupabaseConfigured) {
        setTasks(prev => {
           const updateRecursive = (list: Task[]): Task[] => list.map(t => {
               if (t.id === taskId) return { ...t, resources: t.resources?.filter(r => r.id !== resourceId) };
               if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
               return t;
           });
           return updateRecursive(prev);
        });
        return;
     }
     try {
       const { error } = await supabase.from('resources').delete().eq('id', resourceId);
       if(error) throw error;
       fetchTasks();
     } catch(e) {
       console.error(e);
       alert("Error al eliminar recurso.");
     }
  };

  const handleReorderResources = (taskId: string, resources: Resource[]) => {
      if (taskToView && taskToView.id === taskId) {
         setTaskToView({ ...taskToView, resources });
      }
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
  
  const handleSaveUser = (user: Profile) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.map(u => u.id === user.id ? user : u);
      }
      return [...prev, user];
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleNotificationClick = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setViewMode('CHAT');
    setIsNotifDropdownOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setIsNotifDropdownOpen(false);
  };

  const handleAddEvent = async (date: Date) => {
      // Prompt for title
      const title = prompt("Título del evento:");
      if (!title) return;
      const desc = prompt("Descripción (opcional):") || '';
      
      // Default to first category if available
      const defaultCatId = eventCategories.length > 0 ? eventCategories[0].id : '';

      handleSaveEvent({
          title,
          description: desc,
          start_date: date.toISOString(),
          department: activeTab === 'General' ? DepartmentEnum.DIRECTION : activeTab,
          category_id: defaultCatId,
          is_global: activeTab === 'General',
      });
  };

  // Check if events are enabled for current tab
  const isEventsEnabled = activeTab !== 'General' 
      ? appConfig.departmentConfigs?.[activeTab]?.enableEvents 
      : Object.values(appConfig.departmentConfigs).some((c: any) => c.enableEvents);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* WELCOME SUMMARY MODAL */}
      <WelcomeSummaryModal 
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        overdueTasks={welcomeOverdueTasks}
        upcomingTasks={welcomeUpcomingTasks}
        unreadCount={unreadCount}
        userName={currentUser.full_name}
        onViewTask={handleViewClick}
        onGoToChat={() => setViewMode('CHAT')}
      />

      {/* TOAST DE NOTIFICACIÓN FLOTANTE */}
      {toastNotification && toastNotification.visible && (
        <div className="fixed top-4 right-4 z-[100] bg-white border border-blue-100 rounded-2xl shadow-2xl p-4 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 flex items-start gap-4">
           <img src={toastNotification.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=User`} alt="Avatar" className="w-10 h-10 rounded-xl bg-slate-100 shadow-sm shrink-0" />
           <div className="flex-1 overflow-hidden">
             <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-800 truncate">{toastNotification.title}</h4>
                <button onClick={() => setToastNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
             </div>
             <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
               {toastNotification.message}
             </p>
             <button 
                onClick={() => { setViewMode('CHAT'); setToastNotification(null); }}
                className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
               Responder ahora
             </button>
           </div>
        </div>
      )}

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
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Enterprise</span>
                {isSupabaseConfigured ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-slate-300" />}
              </div>
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
          <NavItem 
            id="General" 
            label="Vista General" 
            icon={<LayoutDashboard size={20} />} 
            isActive={activeTab === 'General' && viewMode !== 'CHAT'} 
            onClick={() => { setActiveTab('General'); setViewMode('LIST'); setIsSidebarOpen(false); }} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            id="Chat" 
            label="Chat Interno" 
            icon={<MessageSquare size={20} />} 
            isActive={viewMode === 'CHAT'} 
            onClick={() => { setViewMode('CHAT'); setIsSidebarOpen(false); }} 
            isCollapsed={isCollapsed} 
            badge={unreadCount} // Muestra el badge rojo si hay mensajes
          />
          
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
            
            {/* --- CAMPANA DE NOTIFICACIONES CON DROPDOWN --- */}
            {viewMode !== 'CHAT' && (
              <div className="relative" ref={notifDropdownRef}>
                <button 
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className={`relative mr-2 p-2 rounded-xl transition-all ${
                    isNotifDropdownOpen || unreadCount > 0 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-100' 
                      : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                  title="Notificaciones"
                >
                  <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>

                {/* DROPDOWN DE NOTIFICACIONES */}
                {isNotifDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-gray-100">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notificaciones</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Check size={12} /> Marcar todo
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                             <Bell size={20} />
                           </div>
                           <p className="text-sm font-bold text-slate-400">Sin mensajes recientes</p>
                           <p className="text-[10px] text-slate-400 mt-1">¡Estás al día con todo!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                           {notifications.map(notif => (
                             <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif.id)}
                                className="p-3 hover:bg-blue-50/50 cursor-pointer transition-colors flex gap-3 group items-start"
                             >
                                <img src={notif.avatar_url} alt="Avatar" className="w-9 h-9 rounded-xl bg-slate-100 shrink-0 object-cover shadow-sm" />
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-xs font-bold text-slate-800 truncate">{notif.sender_name}</p>
                                    <span className="text-[9px] text-slate-400 flex items-center gap-1 shrink-0">
                                      <Clock size={10} />
                                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate line-clamp-2 leading-relaxed group-hover:text-blue-600 transition-colors">
                                    {notif.content}
                                  </p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 bg-slate-50 border-t border-gray-100 text-center">
                       <button 
                        onClick={() => { setViewMode('CHAT'); setIsNotifDropdownOpen(false); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors w-full py-1"
                       >
                         Ir a Mensajes
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentUser.role !== UserRole.AUXILIAR && viewMode !== 'CHAT' && (
               <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                 <Plus size={18} className="sm:mr-2" /> <span className="hidden sm:inline">Nuevo Registro</span>
               </button>
            )}
            {viewMode === 'CHAT' && (
              <button 
                onClick={() => setViewMode('LIST')}
                className="flex items-center text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl text-sm font-bold transition-all"
              >
                <X size={18} className="mr-2" /> <span className="hidden sm:inline">Cerrar Chat</span>
              </button>
            )}
          </div>
        </header>

        <div className={`flex-1 overflow-hidden ${viewMode === 'CHAT' ? '' : 'overflow-y-auto p-4 sm:p-8 custom-scrollbar'}`}>
           {viewMode === 'CHAT' ? (
             <ChatView currentUser={currentUser} onClose={() => setViewMode('LIST')} />
           ) : (
             <>
               <KPIDashboard 
                  tasks={filteredTasks} 
                  events={filteredEvents} 
                  eventCategories={eventCategories}
               />
               
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
                 <>
                   {isLoadingTasks && (
                     <div className="py-8 flex justify-center items-center text-slate-400">
                        <div className="animate-spin mr-2"><Database size={20} /></div> Cargando datos...
                     </div>
                   )}
                   <ProcessList 
                     tasks={filteredTasks}
                     events={filteredEvents}
                     eventCategories={eventCategories} 
                     onStatusChange={handleStatusChange} 
                     onTaskUpdate={handleTaskUpdate} 
                     onEdit={handleEditClick} 
                     onView={handleViewClick}
                     onDeleteEvent={handleDeleteEvent}
                     currentUser={currentUser} 
                     showDepartment={activeTab === 'General'}
                   />
                 </>
               ) : (
                 <CalendarView 
                    tasks={filteredTasks} 
                    events={filteredEvents}
                    eventCategories={eventCategories}
                    onView={handleViewClick} 
                    eventsEnabled={isEventsEnabled}
                    onAddEvent={handleAddEvent}
                    departmentName={activeTab}
                 />
               )}
             </>
           )}
        </div>
      </main>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask} 
        onSaveEvent={handleSaveEvent}
        currentDepartment={activeTab} 
        existingTasks={tasks} 
        availableDepartments={filteredDepartments} 
        users={users} 
        eventCategories={eventCategories}
      />
      <EditTaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateTaskFromModal} task={taskToEdit} users={users} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={appConfig} 
        onSaveSettings={setAppConfig} 
        departments={departments} 
        onUpdateDepartments={setDepartments} 
        departmentCounts={departmentCounts}
        categoryCounts={categoryCounts}
        onRenameDepartment={handleRenameDepartment}
        onRenameCategory={handleRenameCategory}
        currentUser={currentUser}
        users={users}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        eventCategories={eventCategories}
        onSaveEventCategory={handleSaveEventCategory}
        onDeleteEventCategory={handleDeleteEventCategory}
      />
      <TaskDetailModal 
        isOpen={!!taskToView} 
        onClose={() => setTaskToView(null)} 
        task={taskToView} 
        onAddResource={handleAddResource} 
        onEditResource={handleEditResource}
        onDeleteResource={handleDeleteResource}
        onReorderResources={handleReorderResources}
        availableCategories={appConfig.resourceCategories.map(c => c.name)} 
      />
    </div>
  );
}

export default App;
