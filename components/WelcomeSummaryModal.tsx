
import React from 'react';
import { Task, TaskStatus } from '../types';
import { X, AlertTriangle, Clock, MessageSquare, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';

interface WelcomeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueTasks: Task[];
  upcomingTasks: Task[];
  unreadCount: number;
  userName: string;
  onViewTask: (task: Task) => void;
  onGoToChat: () => void;
}

export const WelcomeSummaryModal: React.FC<WelcomeSummaryModalProps> = ({
  isOpen,
  onClose,
  overdueTasks,
  upcomingTasks,
  unreadCount,
  userName,
  onViewTask,
  onGoToChat
}) => {
  if (!isOpen) return null;

  const hasItems = overdueTasks.length > 0 || upcomingTasks.length > 0 || unreadCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header con saludo */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Calendar size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Hola, {userName.split(' ')[0]} 👋</h2>
            <p className="text-slate-300 text-sm">Aquí tienes tu resumen operativo del día.</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/50">
          
          {!hasItems && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">¡Todo al día!</h3>
              <p className="text-slate-500 text-sm max-w-xs">No tienes tareas urgentes ni mensajes pendientes. ¡Excelente trabajo!</p>
            </div>
          )}

          {/* Sección: Vencidas */}
          {overdueTasks.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertTriangle size={20} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Atención Requerida ({overdueTasks.length})</h3>
              </div>
              <div className="space-y-2">
                {overdueTasks.map(task => (
                  <div key={task.id} className="flex items-start justify-between p-3 bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                      <p className="text-[10px] text-red-500 font-medium">Venció el: {task.endDate}</p>
                    </div>
                    <button 
                      onClick={() => { onViewTask(task); onClose(); }}
                      className="text-[10px] font-bold bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      Ver
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Próximas a vencer */}
          {upcomingTasks.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <div className="flex items-center gap-2 mb-4 text-amber-600">
                <Clock size={20} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Vencen pronto (4 días)</h3>
              </div>
              <div className="space-y-2">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-start justify-between p-3 bg-amber-50/50 rounded-xl hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                      <p className="text-[10px] text-amber-600 font-medium">Límite: {task.endDate}</p>
                    </div>
                    <button 
                      onClick={() => { onViewTask(task); onClose(); }}
                      className="text-[10px] font-bold bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      Ver
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Mensajes */}
          {unreadCount > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tienes mensajes sin leer</h3>
                  <p className="text-xs text-blue-100">Hay {unreadCount} {unreadCount === 1 ? 'notificación' : 'notificaciones'} en el chat.</p>
                </div>
              </div>
              <button 
                onClick={() => { onGoToChat(); onClose(); }}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                Ir al Chat <ArrowRight size={14} />
              </button>
            </div>
          )}

        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Entendido, ir al panel
          </button>
        </div>
      </div>
    </div>
  );
};
