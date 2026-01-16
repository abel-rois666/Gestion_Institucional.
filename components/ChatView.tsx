
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, Channel, Profile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Send, 
  Hash, 
  Users, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile,
  Circle,
  Loader2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Plus,
  Lock,
  X,
  UserPlus,
  Trash2,
  Shield,
  UserMinus
} from 'lucide-react';

interface ChatViewProps {
  currentUser: Profile;
  onClose?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  
  // Estados de Miembros del Canal
  const [channelMembers, setChannelMembers] = useState<Profile[]>([]);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState<string | null>(null);
  
  // Estados de Modales
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddMemberMode, setIsAddMemberMode] = useState(false);
  
  // Formulario nuevo canal
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Estados de carga
  const [isChannelsLoading, setIsChannelsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canCreateChannels = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COORDINATOR;
  // Permiso para gestionar miembros: Admin, Coordinador o el Creador del canal
  const canManageMembers = useMemo(() => {
    if (!activeChannel) return false;
    if (activeChannel.type === 'dm') return false; 
    return currentUser.role === UserRole.ADMIN || 
           currentUser.role === UserRole.COORDINATOR || 
           activeChannel.created_by === currentUser.id;
  }, [activeChannel, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', currentUser.id);
    if (data) setAvailableUsers(data);
  };

  const fetchChannels = async () => {
    if (!isSupabaseConfigured) return;
    
    setIsChannelsLoading(true);
    setConnectionError(null);
    
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setChannels(data);
        if (!activeChannel && data.length > 0) {
           const firstPublic = data.find((c: Channel) => c.type === 'public');
           if (firstPublic) setActiveChannel(firstPublic);
        }
      }
      
      fetchUsers();
    } catch (err: any) {
      console.error("Error fetching channels:", err);
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setConnectionError("Tablas no configuradas. Ejecuta 'database_setup.sql'.");
      } else {
        setConnectionError("Error de conexión al chat.");
      }
    } finally {
      setIsChannelsLoading(false);
    }
  };

  // Cargar miembros del canal activo
  const fetchChannelMembers = async (channelId: string) => {
    setIsMemberLoading(true);
    try {
      const { data, error } = await supabase
        .from('channel_members')
        .select('user_id, profiles:user_id(*)')
        .eq('channel_id', channelId);
      
      if (error) throw error;
      
      if (data) {
        const members = data.map((item: any) => item.profiles).filter(Boolean);
        setChannelMembers(members);
      }
    } catch (error: any) {
      console.error("Error fetching members:", error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn("Tabla channel_members no encontrada en Supabase");
      }
    } finally {
      setIsMemberLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !activeChannel) return;

    let subscription: any = null;

    const fetchMessages = async () => {
      setIsMessagesLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profile:profiles(*)')
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (!error && data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
      setIsMessagesLoading(false);
    };

    fetchMessages();
    
    if (activeChannel.type === 'public') {
      fetchChannelMembers(activeChannel.id);
    } else {
      setChannelMembers([]); 
    }

    try {
      subscription = supabase
        .channel(`channel-${activeChannel.id}`)
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `channel_id=eq.${activeChannel.id}` 
          }, 
          async (payload) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();
            
            const senderProfile = profileData || {
              full_name: 'Usuario',
              department: 'General',
              avatar_url: null
            };

            const newMessage: Message = {
              ...(payload.new as any),
              profile: senderProfile
            };
            
            setMessages(prev => {
              // IMPORTANTE: Evitar duplicados si ya lo agregamos manualmente al enviar
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            setTimeout(scrollToBottom, 100);
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Error subscribing to channel:", e);
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !newMessage.trim() || !activeChannel || isSending) return;

    setIsSending(true);
    const content = newMessage;
    setNewMessage('');

    try {
      const { data: userExists } = await supabase.from('profiles').select('id').eq('id', currentUser.id).single();
      if (!userExists) {
        await supabase.from('profiles').insert({
          id: currentUser.id,
          full_name: currentUser.full_name,
          email: currentUser.email,
          department: currentUser.department,
          role: currentUser.role,
          avatar_url: currentUser.avatar_url
        });
      }

      // MODIFICACIÓN CLAVE: Usamos .select().single() para obtener el mensaje creado
      // y actualizar el estado local inmediatamente.
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: activeChannel.id,
          user_id: currentUser.id,
          content: content
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Creamos el objeto mensaje con el perfil actual (porque somos nosotros)
        const optimisticMessage: Message = {
          ...data,
          profile: currentUser
        };
        
        // Actualizamos estado inmediatamente
        setMessages(prev => [...prev, optimisticMessage]);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar mensaje.");
      setNewMessage(content); // Restaurar mensaje si falla
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    const slug = newChannelName.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const { data, error } = await supabase.from('channels').insert({
        name: newChannelName,
        slug: slug,
        description: newChannelDesc,
        type: 'public',
        created_by: currentUser.id
      }).select().single();

      if (error) throw error;
      if (data) {
        try {
           await supabase.from('channel_members').insert({
              channel_id: data.id,
              user_id: currentUser.id,
              role: 'owner'
           });
        } catch (memErr) {
           console.warn("No se pudo añadir al creador como miembro", memErr);
        }

        setChannels(prev => [data, ...prev]);
        setActiveChannel(data);
        setIsCreateChannelOpen(false);
        setNewChannelName('');
        setNewChannelDesc('');
      }
    } catch (error) {
      alert("Error creando canal. Verifica permisos.");
    }
  };

  const handleStartDM = async (targetUser: Profile) => {
    const ids = [currentUser.id, targetUser.id].sort();
    const dmSlug = `dm_${ids[0]}_${ids[1]}`;
    
    const existing = channels.find(c => c.slug === dmSlug && c.type === 'dm');
    
    if (existing) {
      setActiveChannel(existing);
      setIsNewDMOpen(false);
    } else {
      try {
        const { data, error } = await supabase.from('channels').insert({
          name: `${targetUser.full_name}`, 
          slug: dmSlug,
          type: 'dm',
          description: `Chat privado entre ${currentUser.full_name} y ${targetUser.full_name}`,
          created_by: currentUser.id
        }).select().single();

        if (error) throw error;
        if (data) {
          setChannels(prev => [data, ...prev]);
          setActiveChannel(data);
          setIsNewDMOpen(false);
        }
      } catch (e) {
        alert("Error al iniciar conversación.");
      }
    }
  };

  // --- MEMBER MANAGEMENT ---

  const handleAddMember = async (userToAdd: Profile) => {
    if (!activeChannel) return;
    try {
      const { error } = await supabase.from('channel_members').insert({
        channel_id: activeChannel.id,
        user_id: userToAdd.id,
        role: 'member'
      });

      if (error) throw error;
      
      setChannelMembers(prev => [...prev, userToAdd]);
      setIsAddMemberMode(false); 
    } catch (e: any) {
      console.error(e);
      if (e.code === 'PGRST205' || e.code === '42P01') {
         alert("⚠️ Error: Falta tabla 'channel_members'. Ejecuta el script SQL.");
      } else {
         alert(`Error al añadir miembro: ${e.message}`);
      }
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!activeChannel) return;
    
    // Usamos confirm normal para asegurar que el usuario quiere borrar
    const confirmDelete = window.confirm("¿Seguro que quieres eliminar a este usuario del canal?");
    if (!confirmDelete) return;

    console.log("Intentando eliminar usuario:", userIdToRemove, "del canal:", activeChannel.id);
    setIsDeletingMember(userIdToRemove);
    
    try {
      // Importante: Usamos .delete({ count: 'exact' }) para saber si se borró algo
      const { error, count } = await supabase.from('channel_members')
        .delete({ count: 'exact' })
        .eq('channel_id', activeChannel.id)
        .eq('user_id', userIdToRemove);

      if (error) throw error;

      console.log("Eliminación exitosa. Filas afectadas:", count);

      // Actualizar estado local inmediatamente
      setChannelMembers(prev => prev.filter(u => u.id !== userIdToRemove));

    } catch (e: any) {
      console.error("Error al eliminar:", e);
      if (e.code === 'PGRST205' || e.code === '42P01') {
         alert("⚠️ Error: Falta tabla 'channel_members'. Ejecuta el script SQL de configuración V6.");
      } else {
         alert("No se pudo eliminar al usuario. Verifica tu conexión o permisos.");
      }
    } finally {
      setIsDeletingMember(null);
    }
  };

  const publicChannels = useMemo(() => channels.filter(c => c.type !== 'dm'), [channels]);
  const directMessages = useMemo(() => {
    return channels.filter(c => c.type === 'dm' && c.slug.includes(currentUser.id));
  }, [channels, currentUser.id]);

  const getDMName = (channel: Channel) => {
    if (channel.type !== 'dm') return channel.name;
    if (channel.name !== currentUser.full_name) return channel.name;
    const parts = channel.slug.split('_'); 
    const otherId = parts.find(p => p !== 'dm' && p !== currentUser.id);
    const otherUser = availableUsers.find(u => u.id === otherId);
    return otherUser ? otherUser.full_name : 'Chat Privado';
  };

  const usersToAddToChannel = useMemo(() => {
    const memberIds = new Set(channelMembers.map(m => m.id));
    return availableUsers.filter(u => !memberIds.has(u.id) && u.id !== currentUser.id);
  }, [availableUsers, channelMembers, currentUser.id]);


  if (connectionError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={32} />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-gray-800">Problema de Conexión</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">{connectionError}</p>
        </div>
        <div className="flex gap-3">
          {onClose && (
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
              Volver
            </button>
          )}
          <button onClick={fetchChannels} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg">
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Chat Desconectado</h2>
              <p className="text-gray-500 max-w-sm mt-2 text-sm leading-relaxed">
                Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env para habilitar el chat.
              </p>
            </div>
            {onClose && (
              <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">
                <ArrowLeft size={16} /> Volver al Panel
              </button>
            )}
        </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300 relative">
      
      {/* Sidebar de Canales */}
      <div className="w-64 border-r border-gray-100 bg-slate-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-slate-100 border-none rounded-lg py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          
          {/* SECCIÓN CANALES PÚBLICOS */}
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canales</h3>
              {canCreateChannels && (
                <button onClick={() => setIsCreateChannelOpen(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                  <Plus size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-0.5">
              {isChannelsLoading ? (
                 <div className="px-3 py-2 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-300 mb-1" size={16} />
                 </div>
              ) : publicChannels.length === 0 ? (
                 <p className="px-3 text-xs text-slate-400 italic">Sin canales públicos.</p>
              ) : (
                publicChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl transition-all ${
                      activeChannel?.id === channel.id 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' 
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <Hash size={16} className={activeChannel?.id === channel.id ? 'text-blue-500' : 'text-slate-400'} />
                    <span className="ml-2 text-xs font-bold truncate">{channel.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN MENSAJES DIRECTOS */}
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mensajes Directos</h3>
              <button onClick={() => setIsNewDMOpen(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                 <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
               {directMessages.length === 0 ? (
                 <p className="px-3 text-xs text-slate-400 italic">No tienes mensajes recientes.</p>
               ) : (
                 directMessages.map(dm => (
                    <button
                      key={dm.id}
                      onClick={() => setActiveChannel(dm)}
                      className={`w-full flex items-center px-3 py-2 rounded-xl transition-all ${
                        activeChannel?.id === dm.id 
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' 
                          : 'text-slate-600 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="relative">
                        <Users size={16} className={activeChannel?.id === dm.id ? 'text-blue-500' : 'text-slate-400'} />
                        <Circle size={6} className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500 border border-white" />
                      </div>
                      <span className="ml-2 text-xs font-bold truncate">{getDMName(dm)}</span>
                    </button>
                 ))
               )}
            </div>
          </div>

        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.full_name}`} 
                className="w-8 h-8 rounded-lg shadow-sm"
                alt="Yo"
              />
              <Circle size={10} className="absolute -bottom-1 -right-1 text-green-500 fill-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate font-medium">{currentUser.department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeChannel?.type === 'dm' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
              {activeChannel?.type === 'dm' ? <Lock size={20} /> : <Hash size={20} />}
            </div>
            <div className="ml-3 truncate">
              <h2 className="text-sm font-bold text-slate-800">
                 {activeChannel ? (activeChannel.type === 'dm' ? getDMName(activeChannel) : activeChannel.name) : 'Selecciona un canal'}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">{activeChannel?.description || '...'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {activeChannel && activeChannel.type === 'public' && (
              <button 
                onClick={() => { setIsMembersModalOpen(true); setIsAddMemberMode(false); }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 group"
                title="Ver miembros"
              >
                <Users size={18} />
                <span className="text-xs font-bold hidden md:block group-hover:text-blue-600">{channelMembers.length}</span>
              </button>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Lista de Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {!activeChannel ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                 <ArrowLeft size={20} />
              </div>
              <p className="text-sm">Selecciona un canal o usuario para comenzar</p>
            </div>
          ) : isMessagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">Sincronizando mensajes...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
              <p className="text-sm">No hay mensajes aún en esta conversación.</p>
              <p className="text-xs mt-1">¡Saluda ahora!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.user_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img 
                          src={msg.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.profile?.full_name || 'user'}`} 
                          className="w-8 h-8 rounded-lg shadow-sm mt-1 shrink-0"
                          alt="Avatar"
                        />
                      )}
                      <div className={`${isMe ? 'mr-3' : 'ml-3'}`}>
                        {!isMe && <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.profile?.full_name || 'Usuario'}</p>}
                        <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-gray-100 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-[9px] text-slate-400 mt-1 font-medium ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <form onSubmit={handleSendMessage} className="relative flex items-center space-x-2">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={activeChannel ? `Escribir mensaje...` : 'Selecciona un canal'}
                disabled={!activeChannel || isMessagesLoading || isSending} 
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-4 pr-24 text-sm focus:ring-2 focus:ring-blue-500 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <div className="absolute right-2 top-1.5 flex items-center space-x-1">
                <button type="button" disabled={!activeChannel || isSending} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-30">
                  <Smile size={18} />
                </button>
                <button type="button" disabled={!activeChannel || isSending} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-30">
                  <Paperclip size={18} />
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim() || isSending || !activeChannel}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* Modal Crear Canal */}
      {isCreateChannelOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2"><Hash size={16} /> Crear Canal Público</h3>
                <button onClick={() => setIsCreateChannelOpen(false)}><X size={18} /></button>
             </div>
             <div className="p-4 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Canal</label>
                   <input 
                    type="text" 
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    placeholder="ej. Anuncios Generales"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                   <textarea 
                    value={newChannelDesc}
                    onChange={e => setNewChannelDesc(e.target.value)}
                    placeholder="Propósito del canal..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                   />
                </div>
                <button 
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Canal
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo DM */}
      {isNewDMOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm h-[400px] flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold flex items-center gap-2"><UserPlus size={16} /> Nueva Conversación</h3>
                <button onClick={() => setIsNewDMOpen(false)}><X size={18} /></button>
             </div>
             
             <div className="p-2 border-b border-gray-100">
               <input 
                 type="text" 
                 placeholder="Buscar persona..." 
                 className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>

             <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {availableUsers.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => handleStartDM(user)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                     <img src={user.avatar_url} className="w-8 h-8 rounded-lg bg-slate-200" alt="Avatar" />
                     <div className="overflow-hidden">
                       <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                       <p className="text-[10px] text-slate-500 flex items-center gap-1">
                         <span className={`w-1.5 h-1.5 rounded-full ${user.role === UserRole.ADMIN ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                         {user.role} • {user.department}
                       </p>
                     </div>
                  </button>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* Modal Gestión de Miembros */}
      {isMembersModalOpen && activeChannel && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[500px] flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2"><Users size={16} /> Miembros del Canal</h3>
                  <p className="text-[10px] opacity-70">#{activeChannel.slug}</p>
                </div>
                <button onClick={() => setIsMembersModalOpen(false)}><X size={18} /></button>
             </div>

             <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
               
               {/* Barra de herramientas / Switch de modo */}
               <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                 {isAddMemberMode ? (
                   <button onClick={() => setIsAddMemberMode(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                     <ArrowLeft size={14} /> Volver a lista
                   </button>
                 ) : (
                    <span className="text-xs font-bold text-slate-500">{channelMembers.length} participantes</span>
                 )}

                 {!isAddMemberMode && canManageMembers && (
                   <button 
                    onClick={() => setIsAddMemberMode(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                   >
                     <UserPlus size={14} /> Añadir
                   </button>
                 )}
               </div>

               {/* Lista de Contenido */}
               <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                 {isMemberLoading ? (
                   <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                 ) : isAddMemberMode ? (
                   // MODO AÑADIR
                   <div className="space-y-1">
                     <p className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuarios disponibles</p>
                     {usersToAddToChannel.length === 0 ? (
                       <p className="text-center text-xs text-slate-400 py-4">No hay más usuarios para añadir.</p>
                     ) : (
                       usersToAddToChannel.map(user => (
                         <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                           <div className="flex items-center gap-3">
                             <img src={user.avatar_url} className="w-8 h-8 rounded-lg bg-slate-200" alt="Avatar" />
                             <div>
                               <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                               <p className="text-[10px] text-slate-400">{user.role}</p>
                             </div>
                           </div>
                           <button 
                            onClick={() => handleAddMember(user)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                           >
                             <Plus size={16} />
                           </button>
                         </div>
                       ))
                     )}
                   </div>
                 ) : (
                   // MODO LISTA
                   <div className="space-y-1">
                     {channelMembers.map(member => (
                       <div key={member.id} className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                         <div className="flex items-center gap-3">
                           <img src={member.avatar_url} className="w-8 h-8 rounded-lg bg-slate-200" alt="Avatar" />
                           <div>
                             <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                               {member.full_name}
                               {activeChannel.created_by === member.id && (
                                 <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 rounded-full">Creador</span>
                               )}
                             </p>
                             <p className="text-[10px] text-slate-400">{member.department}</p>
                           </div>
                         </div>
                         
                         {canManageMembers && member.id !== currentUser.id && (
                           <button 
                            onClick={(e) => {
                                e.stopPropagation(); // Detiene propagación de eventos
                                handleRemoveMember(member.id);
                            }}
                            disabled={isDeletingMember === member.id}
                            className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                            title="Eliminar del canal"
                           >
                             {isDeletingMember === member.id ? <Loader2 size={16} className="animate-spin text-red-500" /> : <UserMinus size={16} />}
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>

             </div>
           </div>
         </div>
      )}

    </div>
  );
};
