
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Task, TaskStatus, DepartmentEnum, CalendarEvent, EventCategory } from '../types';
import { Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface KPIDashboardProps {
  tasks: Task[];
  events?: CalendarEvent[];
  eventCategories?: EventCategory[];
  upcomingDays?: number; // Configurable days
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

// Helper to flatten task tree for stats
const flattenTasks = (tasks: Task[]): Task[] => {
  let flat: Task[] = [];
  tasks.forEach(t => {
    flat.push(t);
    if (t.subtasks) {
      flat = flat.concat(flattenTasks(t.subtasks));
    }
  });
  return flat;
};

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ 
  tasks, 
  events = [], 
  eventCategories = [],
  upcomingDays = 7 
}) => {
  const allTasks = flattenTasks(tasks);

  // --- STATS LOGIC ---
  const generalProcessesCount = allTasks.filter(t => !t.isSpecificTask).length;
  const specificTasksCount = allTasks.filter(t => t.isSpecificTask).length;

  const statusData = [
    { name: 'Completado', value: allTasks.filter(t => t.status === TaskStatus.COMPLETED).length },
    { name: 'En Proceso', value: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
    { name: 'Pendiente', value: allTasks.filter(t => t.status === TaskStatus.PENDING).length },
    { name: 'Atrasado', value: allTasks.filter(t => t.status === TaskStatus.OVERDUE).length },
  ].filter(d => d.value > 0);

  const deptMap = new Map<string, number>();
  Object.values(DepartmentEnum).forEach(d => deptMap.set(d as string, 0));
  allTasks.forEach(t => {
    deptMap.set(t.department, (deptMap.get(t.department) || 0) + 1);
  });
  const deptData = Array.from(deptMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const efficiencyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- EVENTS LOGIC ---
  const { todaysEvents, upcomingEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() + upcomingDays);

    const sortedEvents = [...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const todayList: CalendarEvent[] = [];
    const upcomingList: CalendarEvent[] = [];

    sortedEvents.forEach(evt => {
      const evtDate = new Date(evt.start_date);
      const normalizedEvtDate = new Date(evtDate);
      normalizedEvtDate.setHours(0, 0, 0, 0);

      if (normalizedEvtDate.getTime() === today.getTime()) {
        todayList.push(evt);
      } else if (normalizedEvtDate.getTime() > today.getTime() && normalizedEvtDate.getTime() <= limitDate.getTime()) {
        upcomingList.push(evt);
      }
    });

    return { todaysEvents: todayList, upcomingEvents: upcomingList };
  }, [events, upcomingDays]);

  const getCategoryColor = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    return cat ? `bg-${cat.color}-100 text-${cat.color}-700 ring-${cat.color}-600/20` : 'bg-slate-100 text-slate-700 ring-slate-400/20';
  };

  const getCategoryName = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  };

  return (
    <div className="space-y-6 mb-8">
      {/* 1. ROW: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Total de Items ({totalTasks})</h3>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
            <div>
              <p className="text-2xl font-bold text-blue-600">{generalProcessesCount}</p>
              <p className="text-xs text-gray-500">Procesos</p>
            </div>
            <div className="border-l border-gray-100 pl-4">
              <p className="text-2xl font-bold text-purple-600">{specificTasksCount}</p>
              <p className="text-xs text-gray-500">Tareas</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Eficiencia Global</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{efficiencyRate}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${efficiencyRate}%` }}></div>
          </div>
        </div>

         <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Tareas Críticas</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
              {allTasks.filter(t => t.status === TaskStatus.OVERDUE).length}
          </p>
          <span className="text-gray-400 text-xs">Atrasadas / Urgentes</span>
        </div>

         <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Próximo Cierre</h3>
          <p className="text-xl font-bold text-gray-900 mt-2 break-words">
             24 de marzo
          </p>
          <span className="text-gray-400 text-xs">Fin de Ciclo 2026</span>
        </div>
      </div>

      {/* 2. ROW: EVENTS AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TODAY'S EVENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
             <div className="flex items-center gap-2 text-blue-800">
               <Calendar size={18} />
               <h3 className="font-bold text-sm uppercase tracking-wide">Agenda de Hoy</h3>
             </div>
             <span className="px-2 py-0.5 bg-white text-blue-600 rounded-md text-xs font-bold shadow-sm">{new Date().toLocaleDateString()}</span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
             {todaysEvents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center py-8">
                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                   <CheckCircle2 size={20} />
                 </div>
                 <p className="text-xs font-bold text-slate-400">Sin eventos programados para hoy.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {todaysEvents.map(evt => (
                   <div key={evt.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-colors">
                      <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-2 sm:px-2 sm:border-r border-blue-100 min-w-[60px]">
                         <Clock size={14} className="text-blue-400 sm:hidden" />
                         <span className="text-xs font-bold text-blue-600">{new Date(evt.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-bold text-slate-800 leading-tight">{evt.title}</h4>
                         <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ring-1 ring-inset ${getCategoryColor(evt.category_id)}`}>
                              {getCategoryName(evt.category_id)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-full">{evt.department}</span>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* UPCOMING EVENTS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
             <div className="flex items-center gap-2 text-slate-700">
               <Clock size={18} />
               <h3 className="font-bold text-sm uppercase tracking-wide">Próximos {upcomingDays} días</h3>
             </div>
             {upcomingEvents.length > 0 && <span className="text-xs text-slate-400 font-medium">{upcomingEvents.length} eventos</span>}
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[400px] lg:max-h-[300px] custom-scrollbar">
             {upcomingEvents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center py-8">
                 <p className="text-xs font-bold text-slate-400">No hay eventos próximos en la agenda.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {upcomingEvents.map(evt => (
                   <div key={evt.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-2 gap-2">
                         <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(evt.category_id).split(' ')[0]} shrink-0`}></div>
                            <span className="text-xs font-bold text-slate-500 uppercase">{new Date(evt.start_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md truncate max-w-[40%]">{evt.department}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug mb-1">{evt.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-1">{evt.description || 'Sin descripción adicional.'}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

      </div>

      {/* 3. ROW: CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-80">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Carga por Área</h3>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fill: '#64748b'}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} name="Tareas" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado General</h3>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
             {statusData.map((entry, index) => (
               <div key={entry.name} className="flex items-center gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
