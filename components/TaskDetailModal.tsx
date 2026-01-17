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
  Play,
  List,
  Layers,
  AlignLeft,
  Info
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
  
  // Accordion States
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [isResourceListOpen, setIsResourceListOpen] = useState(false);
  const [isReportListOpen, setIsReportListOpen] = useState(false);

  // Resource States
  const [localResources, setLocalResources] = useState<Resource[]>([]);
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

  // Initialize and Fetch Data
  useEffect(() => {
    if (isOpen && task) {
      // 1. Initialize with props to show something immediately
      setLocalResources(task.resources || []);
      
      if (isSupabaseConfigured) {
        // 2. Fetch fresh Resources
        supabase
          .from('resources')
          .select('*')
          .eq('task_id', task.id)
          .then(({ data }) => {
             if (data) setLocalResources(data);
          });

        // 3. Fetch fresh Reports
        setIsLoadingReports(true);
        supabase
          .from('reports')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
             if (data) setReports(data as unknown as Report[]);
             setIsLoadingReports(false);
          });
      } else {
         setReports(task.reports || []);
      }
    }
  }, [task?.id, isOpen]); // Depend only on ID to avoid overwriting with stale props on parent updates

  // Reset forms on close
  useEffect(() => {
     if(!isOpen) {
        setEditingResource(null);
        setNewResName('');
        setNewResUrl('');
        setNewResCategory('');
        setPendingDelete(null);
        setActivePreview(null);
        setActiveReport(null);
        setIsResourceFormOpen(false); // Reset accordion
        setIsResourceListOpen(false);
        setIsReportListOpen(false);
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
    
    const resourceData: Resource = {
        id: editingResource ? editingResource.id : crypto.randomUUID(),
        name: newResName,
        url: newResUrl,
        type: type,
        category: newResCategory || 'Otros'
    };

    if (editingResource && onEditResource) {
        onEditResource(task.id, resourceData);
        setLocalResources(prev => prev.map(r => r.id === resourceData.id ? resourceData : r));
        setEditingResource(null);
    } else {
        onAddResource(task.id, resourceData);
        setLocalResources(prev => [...prev, resourceData]);
        // Opcional: Cerrar formulario después de agregar y abrir lista
        // setIsResourceFormOpen(false);
        setIsResourceListOpen(true);
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
      setIsResourceFormOpen(true); // Abrir formulario automáticamente
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
        const newResource: Resource = {
          id: crypto.randomUUID(),
          name: file.name,
          url: result,
          type: getResourceType(result, file.name),
          category: newResCategory || 'Evidencias'
        };
        
        onAddResource(task.id, newResource);
        setLocalResources(prev => [...prev, newResource]);
        setNewResCategory('');
        setIsResourceListOpen(true); // Asegurar que la lista esté visible
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
        setLocalResources(prev => prev.filter(r => r.id !== pendingDelete.id));
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        
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

        <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-4 min-w-0">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.isSpecificTask ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {task.isSpecificTask ? <FileText size={20} /> : <Building2 size={20} />}
               </div>
               <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight truncate">{task.title}</h2>
                  <p className="text-xs text-slate-400 font-medium truncate">{task.department} • {task.status}</p>
               </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors shrink-0">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left Sidebar: Navigation & Lists (Top on Mobile, Left on Desktop) */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 bg-slate-50 flex flex-col shrink-0 max-h-[40vh] lg:max-h-full">
              
              {/* Tab Toggles */}
              <div className="p-4 flex gap-2 shrink-0 bg-white lg:bg-transparent border-b border-gray-100 lg:border-none">
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
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                
                {activeTab === 'resources' ? (
                  <>
                    {/* ACCORDION 1: AÑADIR RECURSO */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setIsResourceFormOpen(!isResourceFormOpen)}
                        className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-all ${isResourceFormOpen ? 'bg-slate-50 text-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2">
                          <Plus size={14} className={isResourceFormOpen ? 'text-blue-600' : 'text-slate-400'} />
                          {editingResource ? 'Editando Recurso' : 'Añadir Nuevo Recurso'}
                        </span>
                        {isResourceFormOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      
                      {isResourceFormOpen && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                          <div className="flex justify-between items-center mb-3">
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${editingResource ? 'text-blue-600' : 'text-slate-400'}`}>
                                  {editingResource ? 'Modo Edición' : 'Formulario'}
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
                              className="w-full text-xs border-b border-gray-200 outline-none py-1 focus:border-blue-500 bg-transparent"
                            />
                            
                            <select
                              value={newResCategory}
                              onChange={e => setNewResCategory(e.target.value)}
                              className="w-full text-xs border-b border-gray-200 outline-none py-1 focus:border-blue-500 bg-transparent text-slate-600"
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
                              className="w-full text-xs border-b border-gray-200 outline-none py-1 focus:border-blue-500 bg-transparent"
                            />
                            <button 
                                type="submit" 
                                className={`w-full py-2 rounded-lg text-[10px] font-bold transition-colors text-white mt-2 ${editingResource ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                            >
                              {editingResource ? 'Guardar Cambios' : 'Vincular Recurso'}
                            </button>
                          </form>
                          
                          {!editingResource && (
                            <>
                                <div className="flex items-center gap-2 my-2">
                                  <div className="h-px bg-slate-200 flex-1"></div>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">O subir archivo</span>
                                  <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-white text-slate-600 py-2 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors border border-dashed border-slate-300"
                                >
                                    <FileUp size={12} className="inline mr-1" /> Seleccionar Archivo
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 2: LISTA DE RECURSOS */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setIsResourceListOpen(!isResourceListOpen)}
                        className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-all ${isResourceListOpen ? 'bg-slate-50 text-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2">
                          <List size={14} className={isResourceListOpen ? 'text-blue-600' : 'text-slate-400'} />
                          Lista de Recursos ({localResources.length})
                        </span>
                        {isResourceListOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {isResourceListOpen && (
                        <div className="p-2 border-t border-slate-100 bg-white animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                            {localResources.map((res, index) => (
                              <div 
                                key={res.id} 
                                onClick={() => { 
                                  if (activePreview?.id === res.id) {
                                      setActivePreview(null);
                                  } else {
                                      setActivePreview(res); 
                                      setActiveReport(null); 
                                      setIsEditingReport(false);
                                      if (editingResource && editingResource.id !== res.id) cancelEditingResource();
                                  }
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
                                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                            {localResources.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                                  <LinkIcon size={16} />
                                </div>
                                <p className="text-xs text-slate-400 italic">No hay recursos vinculados.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
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

                    {/* ACCORDION 3: HISTORIAL DE REPORTES */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setIsReportListOpen(!isReportListOpen)}
                        className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-all ${isReportListOpen ? 'bg-slate-50 text-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2">
                          <List size={14} className={isReportListOpen ? 'text-blue-600' : 'text-slate-400'} />
                          Historial de Reportes ({reports.length})
                        </span>
                        {isReportListOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {isReportListOpen && (
                        <div className="p-2 border-t border-slate-100 bg-white animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                            {isLoadingReports ? (
                               <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : reports.length === 0 ? (
                               <div className="flex flex-col items-center justify-center py-6 text-center">
                                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                                    <FileBarChart size={16} />
                                  </div>
                                  <p className="text-xs text-slate-400 italic">No hay reportes creados.</p>
                               </div>
                            ) : (
                              reports.map(rep => (
                                  <div 
                                    key={rep.id} 
                                    onClick={() => { 
                                      if (activeReport?.id === rep.id) {
                                          setActiveReport(null);
                                      } else {
                                          setActiveReport(rep); 
                                          setIsEditingReport(false); 
                                          setActivePreview(null); 
                                      }
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
                                        className="ml-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
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
                  </div>
                )}
              </div>
            </div>

            {/* Main Content: Editor or Preview */}
            <div 
                className="flex-1 bg-slate-100 p-6 overflow-hidden flex flex-col min-h-[50vh] lg:min-h-0"
                onClick={() => {
                    if (!isEditingReport) {
                        setActivePreview(null);
                        setActiveReport(null);
                    }
                }}
            >
              
              {isEditingReport ? (
                <div 
                    className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-3">
                    <input 
                      type="text" 
                      placeholder="Título del Reporte..." 
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="flex-1 text-lg font-bold outline-none text-slate-800"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
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
                        Guardar
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm">
                    <RichTextEditor 
                      content={reportContent} 
                      onChange={setReportContent} 
                      placeholder="Comienza a redactar tu informe operativo aquí..."
                    />
                  </div>
                </div>
              ) : activeReport ? (
                <div 
                    className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">{activeReport.title}</h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {activeReport.author_name || 'Desconocido'} • {new Date(activeReport.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleEditReport(activeReport)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 text-xs font-bold hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FileText size={14} /> <span className="hidden sm:inline">Editar</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 sm:p-10 prose prose-slate max-w-none prose-sm sm:prose-base">
                     {/* Renderizar HTML del reporte */}
                     <div dangerouslySetInnerHTML={{ __html: activeReport.content }} />
                  </div>
                </div>
              ) : activePreview ? (
                <div 
                    className="h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm overflow-hidden">
                      <ResourceIcon type={activePreview.type} />
                      <span className="truncate max-w-[150px] sm:max-w-xs">{activePreview.name}</span>
                    </div>
                    <div className="flex gap-4 shrink-0">
                      <button onClick={() => setFullScreenResource(activePreview)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <Maximize2 size={12} /> <span className="hidden sm:inline">Expandir</span>
                      </button>
                      <a href={activePreview.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <ExternalLink size={12} /> <span className="hidden sm:inline">Abrir</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-200 relative">
                     {renderResourcePreview(activePreview)}
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-3 sm:p-8 custom-scrollbar flex flex-col items-center justify-start"> {/* Changed alignment to start always to avoid centering issues on small screens with scroll */}
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-10 max-w-3xl w-full mx-auto animate-in fade-in zoom-in-95 duration-300">
                      
                      {/* Header Section */}
                      <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6 border-b border-gray-100 pb-5 sm:pb-6">
                         <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0 mt-1">
                            <AlignLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-1 leading-snug break-words">{task.title}</h3>
                            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-medium text-slate-500">
                               <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{task.department}</span>
                               <span className="hidden sm:inline">•</span>
                               <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md">{task.isSpecificTask ? 'Tarea Específica' : 'Proceso General'}</span>
                            </div>
                         </div>
                      </div>
                      
                      {/* Description Section */}
                      <div className="mb-4">
                        <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Notas y Contexto</h4>
                        {task.description ? (
                          <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3 sm:p-0 rounded-xl sm:bg-transparent sm:rounded-none border border-slate-100 sm:border-none">
                             {task.description}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 italic text-xs sm:text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 border-dashed">
                             <Info size={16} /> Sin descripción o notas adicionales registradas.
                          </div>
                        )}
                      </div>

                      {/* Metadata Grid - Optimized for Mobile */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100">
                         <div className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm shrink-0"><Calendar size={16} /></div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Periodo</p>
                               <p className="text-xs font-bold text-slate-700 truncate">{task.startDate || 'N/A'} — {task.endDate || 'N/A'}</p>
                            </div>
                         </div>
                         <div className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm shrink-0"><User size={16} /></div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Responsable</p>
                               <p className="text-xs font-bold text-slate-700 truncate">{task.assignee_name || 'Sin asignar'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-6 sm:mt-8 text-center pb-4">
                      <p className="text-[10px] sm:text-xs text-slate-400 font-medium max-w-xs mx-auto">
                        Selecciona un elemento del menú lateral para visualizar contenido específico
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
            <div className="flex items-center space-x-4 overflow-hidden">
              <ResourceIcon type={fullScreenResource.type} />
              <h3 className="font-bold truncate">{fullScreenResource.name}</h3>
            </div>
            <button onClick={() => setFullScreenResource(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 p-4 sm:p-8 overflow-hidden">
            <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative">
               {renderResourcePreview(fullScreenResource)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
