import { useCallback, useEffect, useState } from 'react';
import { CircleAlert as AlertCircle, CircleArrowDown as ArrowDownCircle, FileImage, History, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RechargeLog, formatCurrency, formatDate } from '@/lib/types';
import { StatusBadge } from '@/pages/user/UserDashboard';
import { useAuth } from '@/context/AuthContext';

const filters = ['all', 'pending', 'approved', 'rejected'] as const;
type HistoryFilter = (typeof filters)[number];

export default function RechargeHistory() {
  const { session } = useAuth();
  const [records, setRecords] = useState<RechargeLog[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('recharge_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);

    const { data, error: historyError } = await query;
    if (historyError) {
      console.error('recharge history load failed', historyError);
      setError('Could not load your recharge history. Please try again.');
      setRecords([]);
    } else {
      setRecords((data as unknown as RechargeLog[]) || []);
    }
    setLoading(false);
  }, [filter, session]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/25 via-[#131825] to-emerald-500/10 p-6">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-400/15 text-blue-300">
            <History className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">WAYMO Wallet</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Recharge history</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">Follow every top-up from submitted proof to wallet credit.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[#232a3f] bg-[#131825] p-1 no-scrollbar">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-all ${
              filter === item ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#334155] bg-[#131825] px-6 py-16 text-center">
          <ArrowDownCircle className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <h3 className="font-semibold text-white">No recharge requests yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your submitted top-ups will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const approved = record.status === 'approved';
            return (
              <article key={record.id} className="rounded-2xl border border-[#232a3f] bg-[#131825] p-4 transition-colors hover:border-blue-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${approved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <ArrowDownCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{record.payment_method}</h3>
                      <p className="text-xs text-gray-500">{formatDate(record.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${approved ? 'text-emerald-400' : 'text-white'}`}>{formatCurrency(Number(record.amount))}</p>
                    <StatusBadge status={record.status} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#0a0e1a] p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Wallet credited</p>
                    <p className={`mt-1 text-sm font-semibold ${approved ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {approved ? formatCurrency(Number(record.amount)) : 'After approval'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Reference</p>
                    <p className="mt-1 truncate text-sm font-medium text-gray-300">{record.reference_number || 'Not provided'}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  {record.proof_image_url ? (
                    <a href={record.proof_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-blue-400 hover:text-blue-300">
                      <FileImage className="h-3.5 w-3.5" /> View submitted proof
                    </a>
                  ) : <span className="text-gray-600">No proof attached</span>}
                  {record.reviewed_at && <span className="text-gray-500">Reviewed {formatDate(record.reviewed_at)}</span>}
                </div>
                {record.admin_note && <p className="mt-3 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs text-gray-400">Review note: {record.admin_note}</p>}
              </article>
            );
          })}
        </div>
      )}

      <button onClick={loadHistory} className="mx-auto flex items-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-white">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh history
      </button>
    </div>
  );
}
