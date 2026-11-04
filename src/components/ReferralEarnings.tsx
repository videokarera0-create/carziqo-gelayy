import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AdminNotification, formatCurrency, formatDate } from '@/lib/types';
import { Gift, TrendingUp, Users } from 'lucide-react';

interface ReferralEarningsProps {
  refreshTrigger?: number;
}

export default function ReferralEarnings({ refreshTrigger }: ReferralEarningsProps) {
  const { session } = useAuth();
  const [bonuses, setBonuses] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEarned: 0, count: 0 });

  const loadBonuses = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('event_type', 'referral_bonus')
      .order('created_at', { ascending: false });
    const list = (data as unknown as AdminNotification[]) || [];
    setBonuses(list);

    let total = 0;
    list.forEach((b) => {
      const match = b.message.match(/([\d.]+)\s+PHP/);
      if (match) total += parseFloat(match[1]);
    });
    setStats({ totalEarned: total, count: list.length });
    setLoading(false);
  }, [session]);

  useEffect(() => {
    loadBonuses();
  }, [loadBonuses, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary card */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-600/20 via-[#131825] to-blue-600/10 border border-violet-400/20">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-400/10 blur-2xl animate-pulse-slow" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider">Total Referral Earnings</p>
            <p className="text-3xl font-bold text-white mt-0.5">{formatCurrency(stats.totalEarned)}</p>
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
              <Gift className="w-3 h-3" /> {stats.count} bonus{stats.count !== 1 ? 's' : ''} earned · 0.5% per referral recharge
            </p>
          </div>
        </div>
      </div>

      {/* Earnings list */}
      {bonuses.length === 0 ? (
        <div className="text-center py-10 bg-[#131825] rounded-2xl border border-[#232a3f]">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No referral earnings yet</p>
          <p className="text-gray-500 text-xs mt-1">When your friends recharge, you'll earn 0.5% bonus here.</p>
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-violet-400" /> Earnings History
          </h4>
          <div className="space-y-2">
            {bonuses.map((bonus) => {
              const amountMatch = bonus.message.match(/([\d.]+)\s+PHP/);
              const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
              return (
                <div
                  key={bonus.id}
                  className="flex items-center justify-between bg-[#131825] rounded-xl px-4 py-3 border border-[#232a3f] hover:border-violet-400/30 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{bonus.title}</p>
                      <p className="text-gray-500 text-xs truncate">{bonus.message}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{formatDate(bonus.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-violet-400 text-sm font-bold">+{formatCurrency(amount)}</p>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 mt-0.5">
                      0.5%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
