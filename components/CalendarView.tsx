
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, CalendarEvent, EventCategory } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Clock, Plus } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  events?: CalendarEvent[];
  eventCategories: EventCategory[];
  onView: (task: Task) => void;
  // Prop to determine if we should show the toggle
  eventsEnabled?: boolean;
  onAddEvent?: (date: Date) => void;
  departmentName?: string;
}

type ViewMode = 'TASKS' | 'EVENTS';

// Helper to flatten hierarchy for tasks
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

// Helper to check task date range
const isTaskOnDate = (task: Task, date: Date): boolean => {
  if (!task.startDate) return false;
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const [startYear, startMonth, startDay] = task.startDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  let end = start;
  if (task.endDate) {
    const [endYear, endMonth, endDay] = task.endDate.split('-').map(Number);
    end = new Date(endYear, endMonth - 1, endDay);
  }
  return checkDate.getTime() >= start.getTime() && checkDate.getTime() <= end.getTime();
};

// Helper to check event date range
const isEventOnDate = (event: CalendarEvent, date: Date): boolean => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : start;
    
    // Normalize start/end to ignore time for multi-day comparison if needed, 
    // but typically events are point-in-time or ranges. 
    // Simplified: check if date falls between start day and end day.
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    return checkDate.getTime() >= s.getTime() && checkDate.getTime() <= e.getTime();
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, events = [], eventCategories, onView, eventsEnabled = false, onAddEvent, departmentName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('TASKS');

  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const getCategoryStyles = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    if (!cat) return 'bg-gray-100 text-gray-700 border-gray-200';
    return `bg-${cat.color}-100 text-${cat.color}-700 border-${cat.color}-200`;
  };

  const getCategoryName = (catId: string) => {
    const cat = eventCategories.find(c => c.id === catId);
    return cat ? cat.name : 'Evento';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[800px] animate-in fade-in duration-300">
      
      {/* Calendar Header with View Toggle */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center min-w-[180px]">
                <CalendarIcon className="mr-2 text-blue-600" size={20} />
                {monthNames[month]} {year}
            </h2>
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md transition-all text-gray-600"><ChevronLeft size={16} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded-md transition-all">Hoy</button>
                <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md transition-all text-gray-600"><ChevronRight size={16} /></button>
            </div>
        </div>

        {eventsEnabled && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('TASKS')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'TASKS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={14} /> Actividades
                </button>
                <button 
                    onClick={() => setViewMode('EVENTS')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'EVENTS' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock size={14} /> Eventos Importantes
                </button>
            </div>
        )}
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 flex-1 bg-gray-200 gap-px border-b border-gray-200 overflow-hidden">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="bg-white/50" />;

          const isToday = new Date().toDateString() === date.toDateString();
          
          // Logic based on View Mode
          let cellContent;

          if (viewMode === 'TASKS') {
              const dayTasks = flatTasks.filter(t => isTaskOnDate(t, date));
              const visibleTasks = dayTasks.slice(0, 4);
              const remaining = dayTasks.length - 4;

              cellContent = (
                <>
                    {visibleTasks.map(task => (
                    <button
                        key={task.id}
                        onClick={() => onView(task)}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate transition-all shadow-sm border-l-2 mb-1
                        ${task.isSpecificTask 
                            ? 'bg-purple-50 text-purple-700 border-purple-500 hover:bg-purple-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100'}
                        ${task.status === TaskStatus.COMPLETED ? 'opacity-60 line-through decoration-current' : ''}
                        `}
                        title={task.title}
                    >
                        {task.title}
                    </button>
                    ))}
                    {remaining > 0 && <div className="text-[10px] text-gray-400 font-medium pl-1">+ {remaining} más...</div>}
                </>
              );
          } else {
              // EVENTS MODE
              const dayEvents = events.filter(e => isEventOnDate(e, date));
              const visibleEvents = dayEvents.slice(0, 4);
              const remaining = dayEvents.length - 4;

              cellContent = (
                  <>
                     {visibleEvents.map(evt => (
                         <div 
                            key={evt.id}
                            className={`w-full text-left text-[10px] px-2 py-1 rounded-md truncate border mb-1 font-medium ${getCategoryStyles(evt.category_id)}`}
                            title={`${evt.title} (${getCategoryName(evt.category_id)})`}
                         >
                            {evt.title}
                         </div>
                     ))}
                     {remaining > 0 && <div className="text-[10px] text-gray-400 font-medium pl-1">+ {remaining} eventos</div>}
                  </>
              );
          }

          return (
            <div key={date.toISOString()} className={`bg-white p-2 min-h-[100px] flex flex-col hover:bg-gray-50 transition-colors relative group ${isToday ? 'bg-blue-50/20' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                 <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                   {date.getDate()}
                 </span>
                 
                 {viewMode === 'EVENTS' && onAddEvent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddEvent(date); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                    >
                        <Plus size={14} />
                    </button>
                 )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                {cellContent}
              </div>
            </div>
          );
        })}
        
        {days.length % 7 !== 0 && Array.from({ length: 7 - (days.length % 7) }).map((_, i) => (
           <div key={`fill-${i}`} className="bg-white/50" />
        ))}
      </div>
    </div>
  );
};
