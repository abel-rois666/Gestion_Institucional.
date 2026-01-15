
import React, { useState, useRef } from 'react';
import { Task, Resource, Report } from '../types';
import { 
  X, 
  Calendar, 
  User, 
  Building2, 
  Link as LinkIcon, 
  FileText, 
  Youtube, 
  ExternalLink, 
  Trash2, 
  Plus, 
  Eye, 
  Maximize2,
  Upload,
  Image as ImageIcon,
  Check,
  GripVertical,
  FileUp,
  Cloud,
  FileBarChart,
  Palette,
  Save,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddResource: (taskId: string, resource: Resource) => void;
  onDeleteResource: (taskId: string, resourceId: string) => void;
  onReorderResources: (taskId: string, resources: Resource[]) => void;
  availableCategories: string[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddResource,
  onDeleteResource,
  onReorderResources,
  availableCategories
}) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'reports'>('resources');
  
  // Resource States
  const [newResName, setNewResName] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResCategory, setNewResCategory] = useState('');
  const [activePreview, setActivePreview] = useState<Resource | null>(null);
  const [fullScreenResource, setFullScreenResource] = useState<Resource | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Report States
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !task) return null;

  const getResourceType = (url: string, fileName?: string): 'PDF' | 'DRIVE' | 'VIDEO' | 'LINK' | 'IMAGE' => {
    const lowerUrl = url.toLowerCase();
    const lowerName = fileName?.toLowerCase() || '';
    
    if (lowerUrl.includes('drive.google.com')) return 'DRIVE';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'VIDEO';
    if (lowerUrl.endsWith('.pdf') || lowerName.endsWith('.pdf') || lowerUrl.startsWith('data:application/pdf')) return 'PDF';
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/) || lowerName.match(/\.(jpeg|jpg|gif|png|webp)$/) || lowerUrl.startsWith('data:image')) return 'IMAGE';
    return 'LINK';
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim() || !newResUrl.trim()) return;
    const type = getResourceType(newResUrl);
    onAddResource(task.id, {
      id: crypto.randomUUID(),
      name: newResName,
      url: newResUrl,
      type,
      category: newResCategory || 'Otros'
    });
    setNewResName(''); setNewResUrl(''); setNewResCategory('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onAddResource(task.id, {
          id: crypto.randomUUID(),
          name: file.name,
          url: result,
          type: getResourceType(result, file.name),
          category: 'Evidencias'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Report Actions ---
  const handleCreateReport = () => {
    setActiveReport(null);
    setReportTitle('');
    setReportContent('');
    setIsEditingReport(true);
  };

  const handleSaveReport = () => {
    if (!reportTitle.trim()) {
      alert("El reporte necesita un título.");
      return;
    }
    // In a real app, this would call a prop like onAddReport
    // For now, we simulate success
    setIsEditingReport(false);
    alert("Reporte guardado exitosamente (Simulado)");
  };

  const openCanva = () => {
    // Open Canva in a new window with a generic or project-specific link
    window.open('https://www.canva.com/es_mx/crear/', '_blank');
  };

  const getEmbedUrl = (url: string, type: string): string => {
    try {
      if (type === 'DRIVE') return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
      if (type === 'VIDEO') {
        if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
        if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
      }
      return url;
    } catch (e) { return url; }
  };

  const ResourceIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'PDF': return <FileText size={16} className="text-red-500" />;
      case 'DRIVE': return <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4" />;
      case 'VIDEO': return <Youtube size={16} className="text-red-600" />;
      case 'IMAGE': return <ImageIcon size={16} className="text-purple-600" />;
      default: return <LinkIcon size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.isSpecificTask ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {task.isSpecificTask ? <FileText size={20} /> : <Building2 size={20} />}
               </div>
               <div>
                  <h2 className="text-lg font-bold leading-tight">{task.title}</h2>
                  <p className="text-xs text-slate-400 font-medium">{task.department} • {task.status}</p>
               </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar: Navigation & Lists */}
            <div className="w-80 border-r border-gray-100 bg-slate-50 flex flex-col shrink-0">
              
              {/* Tab Toggles */}
              <div className="p-4 flex gap-2">
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  <LinkIcon size={14} /> Recursos
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  <FileBarChart size={14} /> Reportes
                </button>
              </div>

              {/* Dynamic Content Sidebar */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                
                {activeTab === 'resources' ? (
                  <div className="space-y-4">
                    {/* Add Resource Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Añadir Recurso</h4>
                      <form onSubmit={handleAddResource} className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre..."
                          value={newResName}
                          onChange={e => setNewResName(e.target.value)}
                          className="w-full text-xs border-b border-gray-100 outline-none py-1 focus:border-blue-500"
                        />
                        <input
                          type="url"
                          placeholder="URL (Drive, YouTube, etc)..."
                          value={newResUrl}
                          onChange={e => setNewResUrl(e.target.value)}
                          className="w-full text-xs border-b border-gray-100 outline-none py-1 focus:border-blue-500"
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors">
                          Vincular Recurso
                        </button>
                      </form>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-100 text-slate-600 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors border border-dashed border-slate-300"
                      >
                        <FileUp size={12} className="inline mr-1" /> Subir Archivo
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    </div>

                    {/* Resources List */}
                    <div className="space-y-2">
                      {task.resources?.map((res, index) => (
                        <div 
                          key={res.id} 
                          onClick={() => { setActivePreview(res); setActiveReport(null); }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${activePreview?.id === res.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                        >
                          <div className="flex items-center gap-3">
                             <ResourceIcon type={res.type} />
                             <div className="truncate">
                               <p className="text-[11px] font-bold text-slate-800 truncate">{res.name}</p>
                               <p className="text-[9px] text-slate-400 uppercase font-semibold">{res.category || 'Otros'}</p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={handleCreateReport}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <Plus size={16} /> Crear Reporte Nuevo
                    </button>

                    <button 
                      onClick={openCanva}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-200"
                    >
                      <Palette size={16} /> Diseñar en Canva
                    </button>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">Historial de Reportes</h4>
                      {/* Simulated Report List */}
                      {[
                        { id: '1', title: 'Informe Mensual Ene-2026', created_at: '2026-01-20' },
                        { id: '2', title: 'Avance de Proceso de Inscripción', created_at: '2026-01-15' }
                      ].map(rep => (
                        <div 
                          key={rep.id} 
                          onClick={() => { setActiveReport(rep as any); setIsEditingReport(false); setActivePreview(null); }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${activeReport?.id === rep.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                        >
                          <p className="text-[11px] font-bold text-slate-800">{rep.title}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{rep.created_at}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer Meta */}
              <div className="p-4 bg-white border-t border-gray-100 text-[10px] text-slate-400">
                 <div className="flex justify-between mb-1">
                   <span>Asignado a:</span>
                   {/* Fix: Renamed assignee to assignee_name */}
                   <span className="font-bold text-slate-600">{task.assignee_name || 'Sin asignar'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Plazo:</span>
                   <span className="font-bold text-slate-600">{task.endDate || '--'}</span>
                 </div>
              </div>
            </div>

            {/* Main Content: Editor or Preview */}
            <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex flex-col">
              
              {isEditingReport ? (
                <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <input 
                      type="text" 
                      placeholder="Título del Reporte..." 
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="flex-1 text-lg font-bold outline-none text-slate-800"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingReport(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Descartar
                      </button>
                      <button 
                        onClick={handleSaveReport}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                      >
                        <Save size={14} /> Guardar Reporte
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <RichTextEditor 
                      content={reportContent} 
                      onChange={setReportContent} 
                      placeholder="Comienza a redactar tu informe operativo aquí..."
                    />
                  </div>
                </div>
              ) : activeReport ? (
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in">
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{activeReport.title}</h3>
                      {/* Fix: Renamed assignee to assignee_name */}
                      <p className="text-xs text-slate-400 font-medium">Publicado por {task.assignee_name || 'Administrador'} • {activeReport.created_at}</p>
                    </div>
                    <button 
                      onClick={() => { setReportTitle(activeReport.title); setReportContent('<p>Contenido cargado...</p>'); setIsEditingReport(true); }}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 text-xs font-bold hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FileText size={14} /> Editar Contenido
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 prose prose-slate max-w-none">
                     {/* Simulated content */}
                     <h2>Resumen de Operación</h2>
                     <p>Este es un reporte simulado de la tarea <strong>{task.title}</strong>. El objetivo es documentar los avances estratégicos realizados hasta la fecha.</p>
                     <ul>
                       <li>Hito 1: Completado al 100%</li>
                       <li>Hito 2: En revisión por el área de Dirección</li>
                       <li>Pendientes: Validación de presupuesto</li>
                     </ul>
                  </div>
                </div>
              ) : activePreview ? (
                <div className="h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95">
                  <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                      <ResourceIcon type={activePreview.type} />
                      <span className="truncate max-w-xs">{activePreview.name}</span>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setFullScreenResource(activePreview)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <Maximize2 size={12} /> Expandir
                      </button>
                      <a href={activePreview.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <ExternalLink size={12} /> Abrir Original
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-200 relative">
                    {activePreview.type === 'IMAGE' ? (
                      <img src={activePreview.url} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <iframe src={getEmbedUrl(activePreview.url, activePreview.type)} className="w-full h-full border-none" title="Preview" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200">
                    <FileBarChart size={40} />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold">Sin elementos seleccionados</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">
                      Selecciona un recurso vinculado o un reporte redactado para visualizar el contenido aquí.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Resource Overlay */}
      {fullScreenResource && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
          <div className="h-16 flex items-center justify-between px-8 text-white border-b border-white/10">
            <div className="flex items-center space-x-4">
              <ResourceIcon type={fullScreenResource.type} />
              <h3 className="font-bold">{fullScreenResource.name}</h3>
            </div>
            <button onClick={() => setFullScreenResource(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 p-8">
            <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
              {fullScreenResource.type === 'IMAGE' ? (
                <img src={fullScreenResource.url} alt="Full" className="w-full h-full object-contain" />
              ) : (
                <iframe src={getEmbedUrl(fullScreenResource.url, fullScreenResource.type)} className="w-full h-full" title="Full View" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
