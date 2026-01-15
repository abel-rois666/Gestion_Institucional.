import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onView: (task: Task) => void;
}

// Helper to flatten hierarchy
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

// Helper to check date range overlap
const isTaskOnDate = (task: Task, date: Date): boolean => {
  if (!task.startDate) return false;
  
  // Normalize dates to remove time component for comparison
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Parse YYYY-MM-DD
  const [startYear, startMonth, startDay] = task.startDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  
  let end = start;
  if (task.endDate) {
    const [endYear, endMonth, endDay] = task.endDate.split('-').map(Number);
    end = new Date(endYear, endMonth - 1, endDay);
  }

  return checkDate.getTime() >= start.getTime() && checkDate.getTime() <= end.getTime();
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Generate calendar grid
  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[800px]">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <CalendarIcon className="mr-2 text-blue-600" size={20} />
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
             onClick={() => setCurrentDate(new Date())}
             className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
          >
            Hoy
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
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
          if (!date) {
            return <div key={`empty-${index}`} className="bg-white/50" />;
          }

          // Filter tasks for this day
          const dayTasks = flatTasks.filter(t => isTaskOnDate(t, date));
          // Limit visible tasks per day to avoid overflow
          const visibleTasks = dayTasks.slice(0, 4);
          const remaining = dayTasks.length - 4;
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div key={date.toISOString()} className={`bg-white p-2 min-h-[100px] flex flex-col hover:bg-gray-50 transition-colors relative group ${isToday ? 'bg-blue-50/30' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                 <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                   {date.getDate()}
                 </span>
              </div>
              
              <div className="flex-1 space-y-1 overflow-hidden">
                {visibleTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => onView(task)}
                    className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate transition-all shadow-sm border-l-2
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
                {remaining > 0 && (
                  <div className="text-[10px] text-gray-400 font-medium pl-1">
                    + {remaining} más...
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Fill remaining cells to complete the grid visually if needed (simple approximation) */}
        {days.length % 7 !== 0 && Array.from({ length: 7 - (days.length % 7) }).map((_, i) => (
           <div key={`fill-${i}`} className="bg-white/50" />
        ))}
      </div>
    </div>
  );
};