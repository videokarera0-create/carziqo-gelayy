import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage } from '@/lib/types';
import { MessageCircle, X, Send, CircleAlert as AlertCircle, Bot } from 'lucide-react';

interface BotReply {
  keywords: string[];
  reply: string;
}

const BOT_REPLIES: BotReply[] = [
  {
    keywords: ['recharge', 'deposit', 'top up', 'add money', 'load', 'payment', 'pay', 'gcash', 'maya', 'usdt', 'crypto', 'bank'],
    reply: 'To recharge your wallet:\n1. Tap the wallet icon on your dashboard\n2. Enter the amount you want to deposit\n3. Choose a payment method (GCash, Maya, Bank Transfer, or USDT)\n4. Scan the QR code and send the exact amount\n5. Upload a screenshot of your payment receipt\n6. Wait for admin approval — your balance updates automatically once approved\n\nRecharges are usually approved within minutes. Is there anything else?',
  },
  {
    keywords: ['withdraw', 'cash out', 'payout', 'withdrawal', 'transfer out'],
    reply: 'To withdraw your earnings:\n1. Go to your dashboard and tap "Withdraw"\n2. Enter the amount (minimum is ₱500)\n3. Select your withdrawal method (GCash, PayMaya, Bank, or Crypto)\n4. Make sure you have at least one qualified referral with an active rental of ₱500+\n5. Submit and wait for admin review\n\nWithdrawal fees depend on your tier. The more qualified referrals you have, the higher your tier.',
  },
  {
    keywords: ['rental', 'invest', 'car', 'how to invest', 'buy car', 'earn', 'daily', 'return', 'profit'],
    reply: 'To start earning with WAYMO:\n1. Browse available cars in the Car Store\n2. Each car shows its price and daily return rate\n3. Purchase a car to start a rental contract\n4. You earn daily payouts automatically — no action needed\n5. Track your earnings in "My Rentals"\n\nEvery new user gets a FREE starter car (Toyota Corolla) for 15 days. You keep all earnings from it!',
  },
  {
    keywords: ['referral', 'refer', 'invite', 'friend', 'referral code', 'bonus'],
    reply: 'Referral program:\n• Share your referral code with friends\n• When they sign up using your code, you earn 0.5% bonus on every recharge they make\n• Qualified referrals (friends with approved recharges of ₱500+) unlock withdrawals\n• More qualified referrals = higher VIP level and lower withdrawal requirements\n\nFind your referral code in your profile or the Rewards page.',
  },
  {
    keywords: ['vip', 'level', 'tier', 'rank', 'status'],
    reply: 'VIP Levels are based on your referrals and investments:\n• More active referrals = higher referral VIP level\n• Higher investment totals = higher investment VIP level\n• Your VIP level is the higher of the two\n\nVIP levels unlock benefits and reduce withdrawal requirements. Check your current level in your profile.',
  },
  {
    keywords: ['checkin', 'check in', 'daily reward', 'free reward', 'bonus', 'carbon', 'points'],
    reply: 'Daily Check-in:\n• Visit the Rewards page daily to check in\n• Each check-in gives you cash rewards and carbon points\n• Carbon points can be exchanged for coupons and gifts\n\nYou also earn carbon points by playing the Bubble Game in the Rewards section!',
  },
  {
    keywords: ['bubble', 'game', 'play', 'fun'],
    reply: 'Bubble Game:\n• Find it in the Rewards page\n• Pop bubbles to earn carbon points\n• Use carbon points to claim coupons and redeem gifts\n\nIt\'s a fun way to earn extra rewards every day!',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    reply: 'Hello! Welcome to WAYMO Support. I\'m your AI assistant and I can help with:\n• Recharges and payments\n• Withdrawals\n• Car rentals and earnings\n• Referrals and VIP levels\n• Daily rewards and games\n\nType your question or say "talk to agent" to reach a human support team member.',
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'salamat', 'ty'],
    reply: 'You\'re welcome! If you have any other questions, feel free to ask. I\'m here to help 24/7. 😊',
  },
  {
    keywords: ['agent', 'human', 'admin', 'real person', 'operator', 'talk to', 'support team', 'representative'],
    reply: 'I\'m connecting you with a human support agent. Please send your message and our team will respond shortly. You can also continue chatting with me for instant answers anytime!',
  },
  {
    keywords: ['problem', 'issue', 'bug', 'error', 'broken', 'not working', 'cant', "can't", 'stuck', 'fail'],
    reply: 'I\'m sorry you\'re experiencing an issue. For technical problems, please describe what happened in detail and our support team will investigate. You can also try:\n• Refreshing the page\n• Checking your internet connection\n• Clearing your browser cache\n\nIf the issue persists, say "talk to agent" to reach our team directly.',
  },
  {
    keywords: ['password', 'forgot', 'reset', 'login', 'account', 'sign in', 'cant login', 'locked out'],
    reply: 'Account help:\n• If you forgot your password, use the "Forgot password" option on the login screen\n• Make sure you\'re using the correct email address\n• If you\'re still locked out, say "talk to agent" and our team will help you recover your account',
  },
  {
    keywords: ['how', 'what is', 'what are', 'explain', 'guide', 'tutorial', 'start', 'begin', 'new'],
    reply: 'Welcome to WAYMO! Here\'s how to get started:\n1. Recharge your wallet to fund your account\n2. Browse the Car Store and invest in a car\n3. Earn daily payouts automatically\n4. Refer friends to earn bonuses and unlock withdrawals\n5. Withdraw your earnings once you meet the requirements\n\nEvery new user gets a FREE starter car for 15 days. What would you like to know more about?',
  },
];

function findBotReply(message: string): { reply: string; isHandoff: boolean } | null {
  const lower = message.toLowerCase();
  const handoffKeywords = ['agent', 'human', 'admin', 'real person', 'operator', 'talk to', 'support team', 'representative'];
  const isHandoff = handoffKeywords.some((k) => lower.includes(k));

  for (const bot of BOT_REPLIES) {
    if (bot.keywords.some((k) => lower.includes(k))) {
      return { reply: bot.reply, isHandoff };
    }
  }
  return null;
}

export default function UserChatWidget() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [botEnabled, setBotEnabled] = useState(true);
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
    // Auto-disable bot once a real admin has replied, so the conversation is human-only after that.
    if (msgs.some((m) => m.sender_role === 'admin')) setBotEnabled(false);

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
      setSending(false);
      return;
    }
    loadMessages();
    setSending(false);

    // AI assistant: try to answer common questions instantly.
    // If an admin has already joined the conversation, skip the bot.
    if (botEnabled) {
      const match = findBotReply(content);
      if (match) {
        setBotThinking(true);
        // Small delay so the "typing" indicator feels natural.
        await new Promise((r) => setTimeout(r, 900));
        const { error: botErr } = await supabase.from('chat_messages').insert({
          user_id: session.user.id,
          sender_id: session.user.id,
          sender_role: 'bot',
          content: match.reply,
          is_read: true,
        });
        setBotThinking(false);
        if (botErr) {
          console.error('bot reply insert failed', botErr);
        } else {
          loadMessages();
        }
      } else {
        // No keyword match — nudge the user that a human will respond.
        setBotThinking(true);
        await new Promise((r) => setTimeout(r, 700));
        const { error: botErr } = await supabase.from('chat_messages').insert({
          user_id: session.user.id,
          sender_id: session.user.id,
          sender_role: 'bot',
          content: "I couldn't find a quick answer for that. I've notified our support team — a human agent will reply shortly. You can also try asking about: recharge, withdrawal, rentals, referrals, or VIP levels.",
          is_read: true,
        });
        setBotThinking(false);
        if (botErr) {
          console.error('bot fallback insert failed', botErr);
        } else {
          loadMessages();
        }
      }
    }
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
        <div className="fixed bottom-[5.5rem] right-3 z-[60] w-[calc(100vw-1.5rem)] max-w-sm bg-[#131825] border border-blue-500/30 rounded-2xl shadow-2xl shadow-black/40 p-3.5 animate-slide-up">
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
          className="fixed bottom-20 right-5 z-[55] w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 transition-all active:scale-95"
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
        <div className="fixed bottom-[5.5rem] right-3 z-[60] w-[calc(100vw-1.5rem)] max-w-sm bg-[#131825] rounded-2xl border border-[#232a3f] shadow-2xl flex flex-col animate-slide-up" style={{ maxHeight: '75vh' }}>
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
              const isBot = msg.sender_role === 'bot';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isMe
                        ? 'gradient-primary text-white rounded-br-sm'
                        : isBot
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-gray-100 rounded-bl-sm'
                          : 'bg-[#0a0e1a] border border-[#232a3f] text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {isBot && (
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-emerald-500/20">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">AI Assistant</span>
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-blue-100/70' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            {botThinking && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#232a3f] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors"
              placeholder="Type a message..."
              autoFocus
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
