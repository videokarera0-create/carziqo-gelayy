import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, Profile, formatDateShort } from '@/lib/types';
import { MessageCircle, Send, ChevronLeft, Search } from 'lucide-react';

interface Conversation {
  user: Profile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export default function AdminChat() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data: msgData } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false });
    const allMsgs = (data as unknown as ChatMessage[]) || [];

    const userIds = [...new Set(allMsgs.map((m) => m.user_id))];
    if (userIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: users } = await supabase.from('profiles').select('*').in('id', userIds);
    const userMap: Record<string, Profile> = {};
    (users as unknown as Profile[])?.forEach((u) => { userMap[u.id] = u; });

    const convos: Conversation[] = userIds.map((uid) => {
      const userMsgs = allMsgs.filter((m) => m.user_id === uid).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        user: userMap[uid],
        lastMessage: userMsgs[0] || null,
        unreadCount: userMsgs.filter((m) => m.sender_role === 'user' && !m.is_read).length,
      };
    }).filter((c) => c.user);

    convos.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });

    setConversations(convos);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    const msgs = (data as unknown as ChatMessage[]) || [];
    setMessages(msgs);

    const unreadIds = msgs.filter((m) => m.sender_role === 'user' && !m.is_read).map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then(() => {
        loadConversations();
      });
    }
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          loadConversations();
          if (activeUser) loadMessages(activeUser.id);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadConversations, loadMessages, activeUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!session || !activeUser || !input.trim()) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    const { error } = await supabase.from('chat_messages').insert({
      user_id: activeUser.id,
      sender_id: session.user.id,
      sender_role: 'admin',
      content,
    });
    if (error) {
      setInput(content);
    } else {
      loadMessages(activeUser.id);
      loadConversations();
    }
    setSending(false);
  }

  const filteredConvos = conversations.filter((c) =>
    c.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.user.phone || '').includes(search)
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-[#131825] to-emerald-500/10 p-6">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">WAYMO Support</p>
            <h2 className="text-2xl font-bold text-white">Live Chat</h2>
            <p className="mt-1 text-sm text-gray-400">Reply to user conversations in real time.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#131825] rounded-2xl border border-[#232a3f] overflow-hidden" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`${activeUser ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-[#232a3f]`}>
            <div className="p-3 border-b border-[#232a3f]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-[#232a3f] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="Search users..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No conversations yet
                </div>
              ) : (
                filteredConvos.map((c) => (
                  <button
                    key={c.user.id}
                    onClick={() => { setActiveUser(c.user); loadMessages(c.user.id); }}
                    className={`w-full flex items-center gap-3 p-3 border-b border-[#232a3f] transition-all text-left ${
                      activeUser?.id === c.user.id ? 'bg-blue-500/10' : 'hover:bg-[#1a2033]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 font-semibold text-sm flex-shrink-0">
                      {c.user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-semibold truncate">{c.user.full_name}</p>
                        {c.lastMessage && (
                          <span className="text-gray-600 text-[10px] flex-shrink-0 ml-1">
                            {formatDateShort(c.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate">
                        {c.lastMessage ? c.lastMessage.content : 'No messages yet'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          {activeUser ? (
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="flex items-center gap-3 p-3 border-b border-[#232a3f]">
                <button
                  onClick={() => setActiveUser(null)}
                  className="sm:hidden text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 font-semibold text-sm">
                  {activeUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{activeUser.full_name}</p>
                  <p className="text-gray-500 text-xs">{activeUser.phone || 'No phone'}</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No messages in this conversation yet
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_role === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${
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
                  placeholder={`Reply to ${activeUser.full_name}...`}
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
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center text-gray-500 text-sm">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
