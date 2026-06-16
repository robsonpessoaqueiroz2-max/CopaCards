import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  conteudo: string;
  created_at: string;
  lida: boolean;
}

interface Conversation {
  userId: string;
  username: string | null;
  avatar_url: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export function Mensagens() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(targetUserId);
  const [selectedProfile, setSelectedProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setLoadingConvs(false); return; }

    // Group by conversation partner
    const convMap = new Map<string, { messages: Message[]; unread: number }>();
    data.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const existing = convMap.get(partnerId);
      if (!existing) {
        convMap.set(partnerId, {
          messages: [msg],
          unread: !msg.lida && msg.receiver_id === user.id ? 1 : 0,
        });
      } else {
        existing.messages.push(msg);
        if (!msg.lida && msg.receiver_id === user.id) existing.unread++;
      }
    });

    // Fetch profiles for partners
    const partnerIds = Array.from(convMap.keys());
    if (partnerIds.length === 0) { setConversations([]); setLoadingConvs(false); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', partnerIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const convList: Conversation[] = partnerIds.map(pid => {
      const conv = convMap.get(pid)!;
      const lastMsg = conv.messages[0];
      const profile = profileMap.get(pid);
      return {
        userId: pid,
        username: profile?.username || 'Usuário',
        avatar_url: profile?.avatar_url || null,
        lastMessage: lastMsg.conteudo,
        lastTime: lastMsg.created_at,
        unread: conv.unread,
      };
    });

    setConversations(convList);
    setLoadingConvs(false);
  }, [user]);

  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMessages(false);

    // Mark as read
    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', partnerId);
  }, [user]);

  const loadTargetProfile = useCallback(async (pid: string) => {
    const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', pid).single();
    setSelectedProfile(data);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv);
      loadTargetProfile(selectedConv);
    }
  }, [selectedConv, fetchMessages, loadTargetProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !selectedConv) return;

    const channel = supabase
      .channel(`chat_${user.id}_${selectedConv}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedConv || msg.receiver_id === selectedConv) {
            setMessages(prev => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedConv]);

  const handleSend = async () => {
    if (!user || !selectedConv || !newMessage.trim()) return;
    setSending(true);
    const msg = {
      sender_id: user.id,
      receiver_id: selectedConv,
      conteudo: newMessage.trim(),
    };
    const { data } = await supabase.from('mensagens').insert(msg).select().single();
    if (data) setMessages(prev => [...prev, data as Message]);
    setNewMessage('');
    setSending(false);
    fetchConversations();
  };

  const handleSelectConv = (userId: string) => {
    setSelectedConv(userId);
    navigate(`/mensagens?user=${userId}`, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-8rem)]">
      <div
        className="h-full rounded-2xl border border-[var(--border)] overflow-hidden flex"
        style={{ background: 'var(--bg-card)', boxShadow: '0 4px 24px var(--shadow)' }}
      >
        {/* Conversations sidebar */}
        <div
          className={`flex-shrink-0 border-r border-[var(--border)] flex flex-col ${selectedConv ? 'hidden md:flex w-72' : 'flex w-full md:w-72'}`}
        >
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text-primary)]">Mensagens</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shimmer flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-24 rounded shimmer mb-2" />
                      <div className="h-2 w-32 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" className="mx-auto mb-3">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm text-[var(--text-secondary)]">Nenhuma conversa ainda</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Envie mensagem a um usuário pelo feed
                  </p>
                </div>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConv(conv.userId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--border)] transition-colors text-left ${
                    selectedConv === conv.userId ? 'bg-[var(--border)]' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={conv.avatar_url} name={conv.username} size="sm" />
                    {conv.unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold"
                        style={{ background: '#009739', fontSize: '10px' }}
                      >
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{conv.username}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{conv.lastMessage}</p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.lastTime), { addSuffix: false, locale: ptBR })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <button
                onClick={() => { setSelectedConv(null); navigate('/mensagens', { replace: true }); }}
                className="md:hidden p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => navigate(`/perfil/${selectedConv}`)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar src={selectedProfile?.avatar_url} name={selectedProfile?.username} size="sm" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {selectedProfile?.username || 'Usuário'}
                  </p>
                  <p className="text-xs text-[#009739]">Ver perfil</p>
                </div>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
                    <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" className="mx-auto mb-3">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-[var(--text-secondary)]">Nenhuma mensagem ainda.</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Diga olá!</p>
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isSent = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-sm ${isSent ? 'bubble-sent' : 'bubble-received'} px-4 py-2.5 text-sm`}>
                        <p>{msg.conteudo}</p>
                        <p className={`text-xs mt-1 ${isSent ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)] flex gap-2">
              <input
                type="text"
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#009739]"
              />
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!newMessage.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
            <div>
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #012169, #009739)' }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FEDD00" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Suas mensagens</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Selecione uma conversa ou envie mensagem<br />a um usuário pelo feed
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
