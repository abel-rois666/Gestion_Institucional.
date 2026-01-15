import React, { useState, useRef, useEffect } from 'react';
import { Task, Resource, TaskStatus } from '../types';
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
  Camera,
  Video,
  Image as ImageIcon,
  Circle,
  Square,
  RotateCcw,
  Check,
  Aperture,
  GripVertical
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddResource: (taskId: string, resource: Resource) => void;
  onDeleteResource: (taskId: string, resourceId: string) => void;
  onReorderResources: (taskId: string, resources: Resource[]) => void;
  availableCategories: string[]; // New Prop
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
  const [newResName, setNewResName] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResCategory, setNewResCategory] = useState('');
  
  // State for the split-view preview (right panel)
  const [activePreview, setActivePreview] = useState<Resource | null>(null);
  
  // State for the full-screen modal preview
  const [fullScreenResource, setFullScreenResource] = useState<Resource | null>(null);

  // State for Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- CAMERA STATE ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<{ type: 'IMAGE' | 'VIDEO', url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- CAMERA LOGIC (Defined before useEffect and early return) ---

  const startCamera = async (mode: 'PHOTO' | 'VIDEO') => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: mode === 'VIDEO' 
      });
      setStream(newStream);
      setCameraMode(mode);
      setIsCameraOpen(true);
      setCapturedMedia(null);
      
      // Delay slightly to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara. Verifique los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setIsRecording(false);
    setCapturedMedia(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedMedia({ type: 'IMAGE', url: dataUrl });
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        // Convert Blob to Base64 to simulate "upload" and persist in memory as string
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setCapturedMedia({ type: 'VIDEO', url: base64data });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveCapture = () => {
    if (!capturedMedia || !capturedMedia.url) {
      alert("No hay contenido capturado válido para guardar.");
      return;
    }

    if (capturedMedia && task) {
      // Use current date as default name if not provided
      const defaultName = `Captura ${cameraMode === 'PHOTO' ? 'Foto' : 'Video'} - ${new Date().toLocaleTimeString()}`;
      const name = prompt("Nombre del archivo:", defaultName);
      
      if (name) {
        const newResource: Resource = {
          id: crypto.randomUUID(),
          name: name,
          url: capturedMedia.url,
          type: capturedMedia.type,
          category: newResCategory || 'Evidencias'
        };
        onAddResource(task.id, newResource);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedMedia(null);
    // Restart stream if it was stopped (though we keep it running in background usually)
    if (!stream || !stream.active) {
       startCamera(cameraMode);
    }
  };

  // Cleanup stream on close
  useEffect(() => {
    if (!isOpen || !isCameraOpen) {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCameraOpen]);

  if (!isOpen || !task) return null;

  // --- EXISTING LOGIC ---

  const getResourceType = (url: string): 'PDF' | 'DRIVE' | 'VIDEO' | 'LINK' | 'IMAGE' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('drive.google.com')) return 'DRIVE';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'VIDEO';
    if (lowerUrl.endsWith('.pdf')) return 'PDF';
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png)$/) || lowerUrl.startsWith('data:image')) return 'IMAGE';
    return 'LINK';
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!newResName.trim()) {
      alert("Por favor ingrese un nombre para el recurso.");
      return;
    }

    if (!newResUrl.trim()) {
      alert("Por favor ingrese una URL.");
      return;
    }

    try {
      new URL(newResUrl);
    } catch (_) {
      alert("La URL ingresada no es válida. Asegúrese de incluir el protocolo (http:// o https://).");
      return;
    }

    if (newResName && newResUrl) {
      const type = getResourceType(newResUrl);
      const newResource: Resource = {
        id: crypto.randomUUID(),
        name: newResName,
        url: newResUrl,
        type,
        category: newResCategory || 'Otros'
      };
      onAddResource(task.id, newResource);
      setNewResName('');
      setNewResUrl('');
      setNewResCategory('');
    }
  };

  const getEmbedUrl = (url: string, type: string): string => {
    try {
      if (type === 'DRIVE') {
        return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
      }
      if (type === 'VIDEO') {
        if (url.includes('watch?v=')) {
          return url.replace('watch?v=', 'embed/');
        }
        if (url.includes('youtu.be/')) {
          return url.replace('youtu.be/', 'youtube.com/embed/');
        }
      }
      return url;
    } catch (e) {
      return url;
    }
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
          
          {/* Header */}
          <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${task.isSpecificTask ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {task.isSpecificTask ? 'Tarea Específica' : 'Proceso General'}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/20`}>
                  {task.status}
                </span>
              </div>
              <h2 className="text-xl font-bold leading-tight">{task.title}</h2>
            </div>
            <button onClick={onClose} className="hover:bg-gray-700 p-1.5 rounded-full transition">
              <X size={24} />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Left Panel: Info & Resources List */}
            <div className="w-full md:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Meta Data */}
                <div className="space-y-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">{task.department}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{task.startDate || 'N/A'} - {task.endDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{task.assignee || 'Sin asignar'}</span>
                    </div>
                  </div>

                  {task.description && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}
                </div>

                {/* Resources Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    Recursos y Enlaces
                    <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px]">{task.resources?.length || 0}</span>
                  </h3>

                  {/* Add Form */}
                  <div className="mb-4 bg-white p-3 rounded-lg shadow-sm border border-blue-100 space-y-3">
                    <form onSubmit={handleAdd}>
                      <input
                        type="text"
                        placeholder="Nombre del recurso..."
                        value={newResName}
                        onChange={e => setNewResName(e.target.value)}
                        className="w-full text-xs border-b border-gray-200 focus:border-blue-500 outline-none py-1 mb-2"
                      />
                      <div className="mb-2">
                        <select 
                          value={newResCategory} 
                          onChange={e => setNewResCategory(e.target.value)}
                          className="w-full text-xs border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-transparent text-gray-600"
                        >
                          <option value="">Seleccionar Categoría...</option>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newResUrl}
                          onChange={e => setNewResUrl(e.target.value)}
                          className="flex-1 text-xs border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                        />
                        <button 
                          type="submit" 
                          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 disabled:opacity-50"
                          title="Agregar Enlace"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </form>
                    
                    {/* Camera Button */}
                    <div className="pt-2 border-t border-gray-100">
                      <button 
                        type="button"
                        onClick={() => startCamera('PHOTO')}
                        className="w-full flex items-center justify-center space-x-2 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                      >
                        <Camera size={14} />
                        <span>Capturar Foto / Video</span>
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-2">
                    {task.resources?.map((res, index) => (
                      <div 
                        key={res.id} 
                        draggable
                        onDragStart={(e) => setDraggedIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedIndex !== null && draggedIndex !== index) {
                             const newResources = [...(task.resources || [])];
                             const [removed] = newResources.splice(draggedIndex, 1);
                             newResources.splice(index, 0, removed);
                             onReorderResources(task.id, newResources);
                             setDraggedIndex(null);
                          }
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        onClick={() => setActivePreview(res)}
                        className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none
                          ${activePreview?.id === res.id 
                            ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                          ${draggedIndex === index ? 'opacity-40 border-dashed border-gray-400' : ''}  
                        `}
                      >
                        <div className="flex items-center overflow-hidden flex-1">
                          <div 
                            className="mr-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <GripVertical size={14} />
                          </div>
                          <div className="mr-3 shrink-0"><ResourceIcon type={res.type} /></div>
                          <div className="truncate flex-1">
                            <p className="text-sm font-medium text-gray-700 truncate">{res.name}</p>
                            <div className="flex items-center mt-0.5">
                              {res.category && (
                                <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full mr-2 truncate max-w-[100px] border border-gray-200">
                                  {res.category}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 truncate">{res.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center pl-2 shrink-0 space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullScreenResource(res);
                            }}
                            className="text-gray-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50"
                            title="Ver en ventana grande"
                          >
                            <Maximize2 size={14} />
                          </button>
                          {res.type !== 'IMAGE' && res.type !== 'VIDEO' && ( // Only show external link for URLs
                            <a 
                              href={res.url} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                              title="Abrir en nueva pestaña"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('¿Eliminar recurso?')) onDeleteResource(task.id, res.id);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!task.resources || task.resources.length === 0) && (
                      <div className="text-center py-6 text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-lg">
                        No hay recursos adjuntos
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Right Panel: Previewer (Small) */}
            <div className="hidden md:flex flex-1 bg-gray-100 flex-col relative">
              {activePreview ? (
                <>
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center text-xs text-gray-600">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-medium truncate max-w-xs">{activePreview.name}</span>
                      {activePreview.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-700">{activePreview.category}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                        onClick={() => setFullScreenResource(activePreview)}
                        className="flex items-center hover:text-purple-600 mr-2"
                        title="Maximizar"
                       >
                         <Maximize2 size={14} />
                       </button>
                       {activePreview.type !== 'IMAGE' && activePreview.type !== 'VIDEO' && (
                         <a href={activePreview.url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600">
                          Abrir original <ExternalLink size={12} className="ml-1" />
                         </a>
                       )}
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full relative bg-gray-200 flex items-center justify-center overflow-hidden">
                    {/* Render Content based on Type */}
                    {activePreview.type === 'IMAGE' ? (
                       <img src={activePreview.url} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <iframe 
                        src={getEmbedUrl(activePreview.url, activePreview.type)}
                        className="w-full h-full absolute inset-0"
                        title="Resource Preview"
                        allowFullScreen
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <div className="bg-gray-200 p-4 rounded-full mb-4">
                    <Eye size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Visualizador de Recursos</h3>
                  <p className="max-w-xs text-sm">
                    Selecciona un recurso de la lista para previsualizarlo aquí, o haz clic en el icono de expandir <Maximize2 size={12} className="inline"/> para verlo en pantalla completa.
                  </p>
                </div>
              )}
            </div>
            
            {/* --- CAMERA OVERLAY --- */}
            {isCameraOpen && (
              <div className="absolute inset-0 z-10 bg-black flex flex-col">
                {/* Camera Header */}
                <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm absolute top-0 w-full z-20">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => !capturedMedia && startCamera('PHOTO')}
                      className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${cameraMode === 'PHOTO' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                      disabled={!!capturedMedia}
                    >
                      Foto
                    </button>
                    <button 
                      onClick={() => !capturedMedia && startCamera('VIDEO')}
                      className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${cameraMode === 'VIDEO' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                      disabled={!!capturedMedia}
                    >
                      Video
                    </button>
                  </div>
                  <button onClick={stopCamera} className="text-white hover:text-gray-300">
                    <X size={24} />
                  </button>
                </div>

                {/* Viewport */}
                <div className="flex-1 relative flex items-center justify-center bg-black">
                   {capturedMedia ? (
                     capturedMedia.type === 'IMAGE' ? (
                       <img src={capturedMedia.url} alt="Captured" className="max-h-full max-w-full" />
                     ) : (
                       <video src={capturedMedia.url} controls className="max-h-full max-w-full" />
                     )
                   ) : (
                     <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline 
                       muted={cameraMode === 'PHOTO'} // Mute unless recording to prevent feedback
                       className="h-full w-full object-cover" 
                     />
                   )}
                </div>

                {/* Camera Controls */}
                <div className="p-6 bg-black/50 backdrop-blur-sm flex justify-center items-center space-x-8 absolute bottom-0 w-full z-20">
                  {capturedMedia ? (
                    <>
                      <button 
                        onClick={retake}
                        className="flex flex-col items-center text-white hover:text-gray-300 space-y-1"
                      >
                         <RotateCcw size={24} />
                         <span className="text-xs">Retomar</span>
                      </button>
                      <button 
                        onClick={saveCapture}
                        className="flex flex-col items-center text-green-400 hover:text-green-300 space-y-1"
                      >
                         <div className="bg-white rounded-full p-3">
                           <Check size={24} className="text-green-600" />
                         </div>
                         <span className="text-xs">Guardar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Capture Trigger */}
                      {cameraMode === 'PHOTO' ? (
                         <button 
                           onClick={capturePhoto}
                           className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:border-gray-100 flex items-center justify-center transition-transform active:scale-95"
                         >
                           <Aperture size={32} className="text-gray-800" />
                         </button>
                      ) : (
                        <button 
                           onClick={isRecording ? stopRecording : startRecording}
                           className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 border-red-800' : 'bg-white border-gray-300'}`}
                         >
                           {isRecording ? <Square size={24} fill="white" className="text-white" /> : <Circle size={48} className="text-red-600" fill="red" />}
                         </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Resource Modal Overlay */}
      {fullScreenResource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                 <div className="flex items-center space-x-3">
                    <ResourceIcon type={fullScreenResource.type} />
                    <h3 className="font-semibold text-gray-800">{fullScreenResource.name}</h3>
                    {fullScreenResource.category && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                        {fullScreenResource.category}
                      </span>
                    )}
                 </div>
                 <div className="flex items-center space-x-3">
                    {fullScreenResource.type !== 'IMAGE' && (
                        <a 
                        href={fullScreenResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                        Abrir en navegador <ExternalLink size={14} className="ml-1"/>
                        </a>
                    )}
                    <button 
                      onClick={() => setFullScreenResource(null)}
                      className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                    >
                      <X size={20} className="text-gray-600" />
                    </button>
                 </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 w-full relative bg-gray-900 rounded-b-xl overflow-hidden flex items-center justify-center">
                 {fullScreenResource.type === 'IMAGE' ? (
                     <img src={fullScreenResource.url} alt="Full Screen" className="max-h-full max-w-full object-contain" />
                 ) : (
                    <iframe 
                        src={getEmbedUrl(fullScreenResource.url, fullScreenResource.type)}
                        className="w-full h-full absolute inset-0"
                        title="Full Screen Preview"
                        allowFullScreen
                    />
                 )}
              </div>
           </div>
        </div>
      )}
    </>
  );
};