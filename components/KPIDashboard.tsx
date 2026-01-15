import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Task, TaskStatus, DepartmentEnum } from '../types';

interface KPIDashboardProps {
  tasks: Task[];
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

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ tasks }) => {
  const allTasks = flattenTasks(tasks);

  // Calc Counts by Type
  const generalProcessesCount = allTasks.filter(t => !t.isSpecificTask).length;
  const specificTasksCount = allTasks.filter(t => t.isSpecificTask).length;

  // Calc Status Distribution
  const statusData = [
    { name: 'Completado', value: allTasks.filter(t => t.status === TaskStatus.COMPLETED).length },
    { name: 'En Proceso', value: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
    { name: 'Pendiente', value: allTasks.filter(t => t.status === TaskStatus.PENDING).length },
    { name: 'Atrasado', value: allTasks.filter(t => t.status === TaskStatus.OVERDUE).length },
  ].filter(d => d.value > 0);

  // Calc Tasks per Department
  const deptMap = new Map<string, number>();
  Object.values(DepartmentEnum).forEach(d => deptMap.set(d as string, 0));
  
  allTasks.forEach(t => {
    deptMap.set(t.department, (deptMap.get(t.department) || 0) + 1);
  });

  const deptData = Array.from(deptMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  // Calc Efficiency (Completed vs Total)
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const efficiencyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Stat Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-gray-500 text-sm font-medium">Eficiencia Global</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{efficiencyRate}%</p>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${efficiencyRate}%` }}></div>
        </div>
      </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-gray-500 text-sm font-medium">Tareas Críticas</h3>
        <p className="text-3xl font-bold text-red-600 mt-2">
            {allTasks.filter(t => t.status === TaskStatus.OVERDUE).length}
        </p>
        <span className="text-gray-400 text-xs">Atrasadas / Urgentes</span>
      </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-gray-500 text-sm font-medium">Próximo Cierre</h3>
        <p className="text-xl font-bold text-gray-900 mt-2 truncate">
           24 de marzo
        </p>
        <span className="text-gray-400 text-xs">Fin de Ciclo 2026</span>
      </div>

      {/* Charts Row */}
      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Carga por Área</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deptData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
            <Tooltip />
            <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} name="Tareas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado General</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};