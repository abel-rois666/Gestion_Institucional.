
import React, { useState, useEffect, useRef } from 'react';
import { Message, Channel, Profile } from '../types';
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
  MessageSquare
} from 'lucide-react';

interface ChatViewProps {
  currentUser: Profile;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setChannels(data);
        if (data.length > 0 && !activeChannel) {
          setActiveChannel(data[0]);
        }
      }
    };
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !activeChannel) return;

    const fetchMessages = async () => {
      setIsLoading(true);
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
      setIsLoading(false);
    };

    fetchMessages();

    const subscription = supabase
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
          
          const newMessage: Message = {
            ...(payload.new as any),
            profile: profileData
          };
          
          setMessages(prev => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
        alert("El chat requiere Supabase configurado.");
        return;
    }
    if (!newMessage.trim() || !activeChannel || isSending) return;

    setIsSending(true);
    const content = newMessage;
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: activeChannel.id,
        user_id: currentUser.id,
        content: content
      });

    if (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar mensaje");
      setNewMessage(content);
    }
    setIsSending(false);
  };

  if (!isSupabaseConfigured) {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Chat no disponible</h2>
            <p className="text-gray-500 max-w-sm">La funcionalidad de chat interno en tiempo real requiere una conexión activa con Supabase. Por favor, configura las variables de entorno para habilitar esta característica.</p>
        </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
      
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-gray-100 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar canal..." 
              className="w-full bg-slate-100 border-none rounded-lg py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <h3 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canales Disponibles</h3>
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all ${
                activeChannel?.id === channel.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Hash size={18} className={activeChannel?.id === channel.id ? 'text-blue-100' : 'text-slate-400'} />
              <span className="ml-2 text-sm font-semibold truncate">{channel.name}</span>
            </button>
          ))}
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Hash size={20} />
            </div>
            <div className="ml-3 truncate">
              <h2 className="text-sm font-bold text-slate-800">{activeChannel?.name || 'Cargando...'}</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">{activeChannel?.description || 'Canal de comunicación activa'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Users size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">Cargando conversación...</p>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                  <p className="text-sm">No hay mensajes aún en #{activeChannel?.slug}</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.user_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img 
                          src={msg.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.profile?.full_name || 'user'}`} 
                          className="w-8 h-8 rounded-lg shadow-sm mt-1 shrink-0"
                          alt="Avatar"
                        />
                      )}
                      <div className={`${isMe ? 'mr-3' : 'ml-3'}`}>
                        {!isMe && <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.profile?.full_name || 'Usuario'}</p>}
                        <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
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

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="relative flex items-center space-x-2">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={activeChannel ? `Escribir en #${activeChannel.slug}...` : 'Cargando...'}
                disabled={!activeChannel || isLoading}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-4 pr-24 text-sm focus:ring-2 focus:ring-blue-500 shadow-inner disabled:opacity-50"
              />
              <div className="absolute right-2 top-1.5 flex items-center space-x-1">
                <button type="button" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                  <Smile size={18} />
                </button>
                <button type="button" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                  <Paperclip size={18} />
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim() || isSending || !activeChannel}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
          <p className="mt-2 text-center text-[9px] text-slate-400 font-medium uppercase tracking-widest">
            Suscrito a la red interna de {currentUser.department}
          </p>
        </div>
      </div>
    </div>
  );
};
