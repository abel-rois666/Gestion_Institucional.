
import React, { useState, useRef, useEffect } from 'react';
import { Task, Resource, Report } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  ChevronDown,
  Loader2,
  Edit2,
  AlertTriangle,
  Download,
  Play
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddResource: (taskId: string, resource: Resource) => void;
  onEditResource?: (taskId: string, resource: Resource) => void;
  onDeleteResource: (taskId: string, resourceId: string) => void;
  onReorderResources: (taskId: string, resources: Resource[]) => void;
  availableCategories: string[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onReorderResources,
  availableCategories
}) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'reports'>('resources');
  
  // Resource States
  const [newResName, setNewResName] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResCategory, setNewResCategory] = useState('');
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  const [activePreview, setActivePreview] = useState<Resource | null>(null);
  const [fullScreenResource, setFullScreenResource] = useState<Resource | null>(null);
  
  // Report States
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // DELETE CONFIRMATION STATE
  const [pendingDelete, setPendingDelete] = useState<{ type: 'resource' | 'report', id: string, name?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar reportes cuando se abre la tarea
  useEffect(() => {
    if (isOpen && task && isSupabaseConfigured) {
      const fetchReports = async () => {
        setIsLoadingReports(true);
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false });
        
        if (data) {
          setReports(data as unknown as Report[]);
        }
        setIsLoadingReports(false);
      };
      fetchReports();
    } else if (isOpen && task && !isSupabaseConfigured) {
       setReports(task.reports || []);
    }
  }, [isOpen, task]);

  // Resetear formulario al cerrar o cambiar tab
  useEffect(() => {
     if(!isOpen) {
        setEditingResource(null);
        setNewResName('');
        setNewResUrl('');
        setNewResCategory('');
        setPendingDelete(null);
     }
  }, [isOpen]);

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

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim() || !newResUrl.trim()) return;
    
    const type = getResourceType(newResUrl);
    
    if (editingResource && onEditResource) {
        onEditResource(task.id, {
            ...editingResource,
            name: newResName,
            url: newResUrl,
            type: type,
            category: newResCategory || 'Otros'
        });
        setEditingResource(null);
    } else {
        onAddResource(task.id, {
            id: crypto.randomUUID(),
            name: newResName,
            url: newResUrl,
            type,
            category: newResCategory || 'Otros'
        });
    }
    setNewResName(''); setNewResUrl(''); setNewResCategory('');
  };

  const startEditingResource = (res: Resource, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingResource(res);
      setNewResName(res.name);
      setNewResUrl(res.url);
      setNewResCategory(res.category || '');
      setActiveTab('resources');
  };

  const cancelEditingResource = () => {
      setEditingResource(null);
      setNewResName('');
      setNewResUrl('');
      setNewResCategory('');
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
          category: newResCategory || 'Evidencias'
        });
        setNewResCategory('');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- DELETE LOGIC ---

  const requestDelete = (type: 'resource' | 'report', id: string, name: string) => {
    setPendingDelete({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'resource') {
        onDeleteResource(task.id, pendingDelete.id);
        if (activePreview?.id === pendingDelete.id) setActivePreview(null);
    } else {
        // Eliminar reporte
        const reportId = pendingDelete.id;
        
        // 1. Eliminar de base de datos
        if (isSupabaseConfigured) {
             const { error } = await supabase.from('reports').delete().eq('id', reportId);
             if (error) {
                 alert('Error al eliminar el reporte de la base de datos.');
                 setPendingDelete(null);
                 return;
             }
        }
        
        // 2. Actualizar estado local
        setReports(prev => prev.filter(r => r.id !== reportId));
        if (activeReport?.id === reportId) {
             setActiveReport(null);
             setIsEditingReport(false);
        }
    }
    setPendingDelete(null);
  };

  // --- Report Actions ---
  const handleCreateReport = () => {
    setActiveReport(null);
    setReportTitle('');
    setReportContent('');
    setIsEditingReport(true);
  };

  const handleEditReport = (rep: Report) => {
      setActiveReport(rep);
      setReportTitle(rep.title);
      setReportContent(rep.content);
      setIsEditingReport(true);
  };

  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      alert("El reporte necesita un título.");
      return;
    }

    setIsSavingReport(true);

    try {
      const newReportData = {
        task_id: task.id,
        title: reportTitle,
        content: reportContent,
        author_id: task.assignee_id || 'system', 
        author_name: task.assignee_name || 'Sistema'
      };

      if (isSupabaseConfigured) {
         let result;
         if (activeReport?.id) {
            // Actualizar
            result = await supabase
              .from('reports')
              .update(newReportData)
              .eq('id', activeReport.id)
              .select()
              .single();
         } else {
            // Crear
            result = await supabase
              .from('reports')
              .insert(newReportData)
              .select()
              .single();
         }

         if (result.error) throw result.error;

         if (result.data) {
           setReports(prev => {
             if (activeReport?.id) {
               return prev.map(r => r.id === result.data.id ? result.data as unknown as Report : r);
             }
             return [result.data as unknown as Report, ...prev];
           });
           setActiveReport(result.data as unknown as Report);
         }
      } else {
        // Mock Save
        const mockReport: Report = {
            id: activeReport?.id || crypto.randomUUID(),
            ...newReportData,
            created_at: new Date().toISOString()
        };
        setReports(prev => {
            if (activeReport?.id) {
                return prev.map(r => r.id === mockReport.id ? mockReport : r);
            }
            return [mockReport, ...prev];
        });
        setActiveReport(mockReport);
      }
      
      setIsEditingReport(false);
    } catch (error: any) {
      console.error("Error saving report:", error);
      if (error.code === '42P01') {
          alert("Error: La tabla 'reports' no existe. Ejecuta el script SQL actualizado.");
      } else {
          alert("Error al guardar el reporte.");
      }
    } finally {
      setIsSavingReport(false);
    }
  };

  const openCanva = () => {
    window.open('https://www.canva.com/es_mx/crear/', '_blank');
  };

  // Helper para normalizar URLs de Drive antes de renderizar
  const normalizeDriveUrl = (url: string) => {
      return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
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

  // Función mejorada para renderizar recursos
  const renderResourcePreview = (resource: Resource) => {
    // 1. PRIORIDAD: Si es imagen
    if (resource.type === 'IMAGE') {
      return <img src={resource.url} alt="Preview" className="w-full h-full object-contain p-4" />;
    }

    // 2. PRIORIDAD: Si es enlace de Google Drive (independientemente del tipo 'PDF' o 'DRIVE')
    // Esto corrige los errores de consola al evitar pasar links de Drive por el visor de Docs.
    if (resource.url.includes('drive.google.com')) {
        return (
          <iframe 
            src={normalizeDriveUrl(resource.url)} 
            className="w-full h-full border-none bg-white" 
            title="Drive Preview"
            allow="autoplay"
          />
        );
    }
    
    // 3. PRIORIDAD: PDF (Solo si NO es Drive)
    if (resource.type === 'PDF') {
      // Caso A: Archivo local (Data URI)
      if (resource.url.startsWith('data:')) {
         return (
            <div className="w-full h-full flex flex-col">
               <object data={resource.url} type="application/pdf" className="w-full h-full flex-1 rounded-b-xl">
                   {/* Fallback si el navegador no soporta <object> para PDF */}
                   <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center bg-slate-50">
                      <FileText size={48} className="mb-4 text-slate-300" />
                      <p className="font-bold text-slate-700">Vista previa no disponible.</p>
                      <p className="text-xs mb-4">Tu navegador no permite visualizar este archivo directamente.</p>
                      <a 
                        href={resource.url} 
                        download={resource.name || "documento.pdf"} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Download size={14} /> Descargar archivo
                      </a>
                   </div>
               </object>
            </div>
         );
      }
      
      // Caso B: URL remota directa a un PDF (NO Drive) -> Usar Google Viewer
      const encodedUrl = encodeURIComponent(resource.url);
      return (
        <iframe 
          src={`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`} 
          className="w-full h-full border-none bg-white" 
          title="PDF Preview" 
        />
      );
    }

    // 4. PRIORIDAD: VIDEO (YouTube)
    if (resource.type === 'VIDEO') {
        let videoId: string | null = null;
        
        // Extracción robusta de ID de YouTube incluyendo Shorts
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = resource.url.match(regExp);
        
        if (match && match[2].length === 11) {
            videoId = match[2];
        }

        if (videoId) {
            // FIX ERROR 153:
            // 1. Usar 'www.youtube.com' (standard)
            // 2. Agregar parametro 'origin'
            const origin = window.location.origin;
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${origin}`;
            
            return (
              <iframe 
                src={embedUrl} 
                className="w-full h-full border-none bg-black" 
                title="Video Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            );
        }

        // Fallback video externo
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Play size={32} className="ml-1" />
                </div>
                <h3 className="text-lg font-bold">Reproducción externa</h3>
                <p className="text-sm text-slate-400 mt-2 mb-6 max-w-xs">
                    Este video no se puede insertar directamente.
                </p>
                <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                >
                    <ExternalLink size={18} /> Ver video original
                </a>
            </div>
        );
    }

    // Default (Links genéricos)
    return (
      <iframe 
        src={resource.url}
        className="w-full h-full border-none bg-white" 
        title="Preview"
      />
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        
        {/* DELETE CONFIRMATION OVERLAY */}
        {pendingDelete && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                   <div className="p-2 bg-red-50 rounded-xl">
                     <AlertTriangle size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">¿Eliminar elemento?</h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-slate-600">
                    Estás a punto de eliminar {pendingDelete.type === 'resource' ? 'el recurso' : 'el reporte'}:
                  </p>
                  <p className="font-bold text-slate-800 mt-1">"{pendingDelete.name}"</p>
                  <p className="text-xs text-slate-400 mt-2">Esta acción no se puede deshacer.</p>
                </div>

                <div className="flex gap-3 justify-end">
                   <button 
                    onClick={() => setPendingDelete(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                   >
                     Sí, eliminar
                   </button>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
          
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
                  onClick={() => {
                    setActiveTab('resources');
                    setActiveReport(null);
                    setIsEditingReport(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  <LinkIcon size={14} /> Recursos
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('reports');
                    setActivePreview(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  <FileBarChart size={14} /> Reportes
                </button>
              </div>

              {/* Dynamic Content Sidebar */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                
                {activeTab === 'resources' ? (
                  <div className="space-y-4">
                    {/* Add/Edit Resource Card */}
                    <div className={`p-4 rounded-xl shadow-sm border space-y-3 transition-colors ${editingResource ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-center">
                          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${editingResource ? 'text-blue-600' : 'text-slate-400'}`}>
                              {editingResource ? 'Editando Recurso' : 'Añadir Recurso'}
                          </h4>
                          {editingResource && (
                              <button onClick={cancelEditingResource} className="text-[10px] font-bold text-slate-400 hover:text-red-500">
                                  Cancelar
                              </button>
                          )}
                      </div>
                      
                      <form onSubmit={handleResourceSubmit} className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre..."
                          value={newResName}
                          onChange={e => setNewResName(e.target.value)}
                          className="w-full text-xs border-b border-gray-100 outline-none py-1 focus:border-blue-500 bg-transparent"
                        />
                        
                        <select
                          value={newResCategory}
                          onChange={e => setNewResCategory(e.target.value)}
                          className="w-full text-xs border-b border-gray-100 outline-none py-1 focus:border-blue-500 bg-transparent text-slate-600"
                        >
                          <option value="">Categoría (Opcional)...</option>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        <input
                          type="url"
                          placeholder="URL (Drive, YouTube, etc)..."
                          value={newResUrl}
                          onChange={e => setNewResUrl(e.target.value)}
                          className="w-full text-xs border-b border-gray-100 outline-none py-1 focus:border-blue-500 bg-transparent"
                        />
                        <button 
                            type="submit" 
                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-colors text-white ${editingResource ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                          {editingResource ? 'Guardar Cambios' : 'Vincular Recurso'}
                        </button>
                      </form>
                      
                      {!editingResource && (
                        <>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-slate-100 text-slate-600 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors border border-dashed border-slate-300"
                            >
                                <FileUp size={12} className="inline mr-1" /> Subir Archivo
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        </>
                      )}
                    </div>

                    {/* Resources List */}
                    <div className="space-y-2">
                      {task.resources?.map((res, index) => (
                        <div 
                          key={res.id} 
                          onClick={() => { 
                            setActivePreview(res); 
                            setActiveReport(null); 
                            setIsEditingReport(false);
                            if (editingResource && editingResource.id !== res.id) cancelEditingResource();
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                              activePreview?.id === res.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 
                              editingResource?.id === res.id ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200' : 
                              'bg-white border-gray-100 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <ResourceIcon type={res.type} />
                             <div className="truncate flex-1">
                               <p className="text-[11px] font-bold text-slate-800 truncate">{res.name}</p>
                               <p className="text-[9px] text-slate-400 uppercase font-semibold">{res.category || 'Otros'}</p>
                             </div>
                             
                             {/* Actions */}
                             <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => startEditingResource(res, e)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Editar"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestDelete('resource', res.id, res.name);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                    title="Eliminar"
                                >
                                    <Trash2 size={12} />
                                </button>
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
                      
                      {isLoadingReports ? (
                         <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                      ) : reports.length === 0 ? (
                         <p className="text-xs text-slate-400 text-center italic py-2">No hay reportes creados.</p>
                      ) : (
                        reports.map(rep => (
                            <div 
                              key={rep.id} 
                              onClick={() => { 
                                setActiveReport(rep); 
                                setIsEditingReport(false); 
                                setActivePreview(null); 
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all group ${activeReport?.id === rep.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="truncate flex-1">
                                   <p className="text-[11px] font-bold text-slate-800 truncate">{rep.title}</p>
                                   <p className="text-[9px] text-slate-400 mt-1 font-medium flex justify-between">
                                     <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                                     <span className="opacity-70">{rep.author_name}</span>
                                   </p>
                                </div>
                                
                                <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      requestDelete('report', rep.id, rep.title);
                                  }}
                                  className="ml-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Eliminar Reporte"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer Meta */}
              <div className="p-4 bg-white border-t border-gray-100 text-[10px] text-slate-400">
                 <div className="flex justify-between mb-1">
                   <span>Asignado a:</span>
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
                      autoFocus
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
                        disabled={isSavingReport}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
                      >
                        {isSavingReport ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} 
                        Guardar Reporte
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
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{activeReport.title}</h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Publicado por {activeReport.author_name || 'Desconocido'} • {new Date(activeReport.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleEditReport(activeReport)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 text-xs font-bold hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FileText size={14} /> Editar Contenido
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 prose prose-slate max-w-none">
                     {/* Renderizar HTML del reporte */}
                     <div dangerouslySetInnerHTML={{ __html: activeReport.content }} />
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
                     {renderResourcePreview(activePreview)}
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
               {renderResourcePreview(fullScreenResource)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
