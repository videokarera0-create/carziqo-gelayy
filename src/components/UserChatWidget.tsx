import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage } from '@/lib/types';
import { MessageCircle, X, Send, CircleAlert as AlertCircle } from 'lucide-react';

export default function UserChatWidget() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastToastRef = useRef<string | null>(null);
  const openRef = useRef(false);

  const loadMessages = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    const msgs = (data as unknown as ChatMessage[]) || [];
    setMessages(msgs);
    const unreadAdmin = msgs.filter((m) => m.sender_role === 'admin' && !m.is_read);
    setUnread(unreadAdmin.length);

    if (unreadAdmin.length > 0) {
      const unreadIds = unreadAdmin.map((m) => m.id);
      supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then(() => {
        setUnread(0);
      });
    }
  }, [session]);

  const loadUnreadOnly = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('sender_role', 'admin')
      .eq('is_read', false)
      .order('created_at', { ascending: true });
    const unreadAdmin = (data as unknown as ChatMessage[]) || [];
    setUnread(unreadAdmin.length);
  }, [session]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open || !session) return;
    loadMessages();
  }, [open, session, loadMessages]);

  useEffect(() => {
    if (!session) return;
    loadUnreadOnly();

    const channel = supabase
      .channel('user-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          const newMsg = payload.new as unknown as ChatMessage;
          if (newMsg.sender_role === 'admin') {
            if (openRef.current) {
              loadMessages();
            } else {
              setUnread((prev) => prev + 1);
              if (lastToastRef.current !== newMsg.id) {
                lastToastRef.current = newMsg.id;
                setToast(newMsg);
                setTimeout(() => setToast(null), 6000);
              }
            }
          } else if (openRef.current) {
            loadMessages();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadMessages, loadUnreadOnly]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!session || !input.trim()) return;
    setSending(true);
    setError(null);
    const content = input.trim();
    setInput('');
    const { error: insErr } = await supabase.from('chat_messages').insert({
      user_id: session.user.id,
      sender_id: session.user.id,
      sender_role: 'user',
      content,
    });
    if (insErr) {
      console.error('user chat send failed', insErr);
      setError('Could not send message: ' + insErr.message);
      setInput(content);
    } else {
      loadMessages();
    }
    setSending(false);
  }

  function openChat() {
    setOpen(true);
    setToast(null);
    setError(null);
  }

  return (
    <>
      {/* Toast notification (when chat is closed) */}
      {toast && !open && (
        <div className="fixed bottom-36 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm bg-[#131825] border border-blue-500/30 rounded-2xl shadow-2xl shadow-black/40 p-3.5 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">WAYMO Support</p>
              <p className="text-gray-400 text-xs mt-0.5 line-clamp-2 break-words">{toast.content}</p>
              <button onClick={openChat} className="text-blue-400 text-xs font-medium mt-2 hover:text-blue-300">
                Open chat
              </button>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={openChat}
          className="fixed bottom-20 right-5 z-40 w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 transition-all active:scale-95"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm bg-[#131825] rounded-2xl border border-[#232a3f] shadow-2xl flex flex-col animate-slide-up" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#232a3f]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">WAYMO Support</h3>
                <p className="text-emerald-400 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !error && (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Start a conversation with our support team</p>
                <p className="text-gray-600 text-xs mt-1">We typically reply within minutes</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_role === 'user';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isMe
                        ? 'gradient-primary text-white rounded-br-sm'
                        : 'bg-[#0a0e1a] border border-[#232a3f] text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-blue-100/70' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#232a3f] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:opacity-90 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
