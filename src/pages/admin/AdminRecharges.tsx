import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RechargeLog, Profile, formatCurrency, formatDate } from '@/lib/types';
import { Check, X, Clock, CircleArrowDown as ArrowDownCircle, CircleAlert as AlertCircle, FileImage } from 'lucide-react';

export default function AdminRecharges() {
  const [recharges, setRecharges] = useState<RechargeLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selected, setSelected] = useState<RechargeLog | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadRecharges();
  }, [filter]);

  async function loadRecharges() {
    setLoading(true);
    let query = supabase.from('recharge_logs').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) {
      console.error('admin recharge load failed', error);
      setNotice('Could not load recharge requests. Please try again.');
    }
    const rechargesData = (data as unknown as RechargeLog[]) || [];
    setRecharges(rechargesData);

    const userIds = [...new Set(rechargesData.map((r) => r.user_id))];
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('profiles').select('*').in('id', userIds);
      const map: Record<string, Profile> = {};
      (users as unknown as Profile[])?.forEach((u) => { map[u.id] = u; });
      setUserMap(map);
    }
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setActioning(id);
    const { error } = await supabase.rpc('approve_recharge', { p_recharge_id: id });
    if (error) {
      console.error('recharge approval failed', error);
      setNotice('Could not approve this recharge. It may already have been reviewed.');
    } else {
      await loadRecharges();
    }
    setActioning(null);
  }

  async function handleReject(id: string) {
    setActioning(id);
    const note = window.prompt('Optional rejection note') || 'Rejected by admin';
    const { error } = await supabase.rpc('reject_recharge', { p_recharge_id: id, p_note: note });
    if (error) {
      console.error('recharge rejection failed', error);
      setNotice('Could not reject this recharge. It may already have been reviewed.');
    } else {
      await loadRecharges();
    }
    setActioning(null);
  }

  const filters = ['pending', 'approved', 'rejected', 'all'] as const;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-[#131825] to-emerald-500/10 p-6">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <img src="/assets/images/waymo-removebg-preview.png" alt="WAYMO" className="h-12 w-12 rounded-xl bg-white p-1.5 object-contain" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">WAYMO Operations</p>
            <h2 className="text-2xl font-bold text-white">Recharge approvals</h2>
            <p className="mt-1 text-sm text-gray-400">Verify receipts before wallet credit is released.</p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-amber-200 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 p-1 bg-[#131825] rounded-xl w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recharges.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No {filter !== 'all' ? filter : ''} recharges found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recharges.map((r) => {
            const user = userMap[r.user_id];
            return (
              <div key={r.id} className="bg-[#131825] rounded-xl border border-[#232a3f] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{user?.full_name || 'Unknown user'}</p>
                        <p className="text-gray-500 text-xs">{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">{formatCurrency(Number(r.amount))}</p>
                      <StatusPill status={r.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <InfoRow label="Method" value={r.payment_method} />
                    <InfoRow label="Reference" value={r.reference_number || 'N/A'} />
                    <InfoRow label="User Phone" value={user?.phone || 'N/A'} />
                    <InfoRow label="Reviewed" value={r.reviewed_at ? formatDate(r.reviewed_at) : '—'} />
                  </div>

                  {r.proof_image_url && (
                    <button
                      onClick={() => setSelected(r)}
                      className="flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300 mb-3"
                    >
                      <FileImage className="w-4 h-4" /> View payment proof
                    </button>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={actioning === r.id}
                        className="flex-1 flex items-center justify-center gap-2 gradient-accent text-white font-semibold py-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        disabled={actioning === r.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-2.5 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                  {r.admin_note && (
                    <div className="mt-2 text-xs text-gray-400 bg-[#0a0e1a] rounded-lg px-3 py-2">
                      Admin note: {r.admin_note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof viewer modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div className="bg-[#131825] rounded-2xl border border-[#232a3f] p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Payment Proof</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selected.proof_image_url!}
              alt="Payment proof"
              onClick={() => setZoom(selected.proof_image_url!)}
              className="w-full rounded-lg cursor-zoom-in transition-transform hover:opacity-90"
            />
            <button
              onClick={() => setZoom(selected.proof_image_url!)}
              className="mt-2 w-full flex items-center justify-center gap-2 text-blue-400 text-xs hover:text-blue-300 py-1.5"
            >
              <FileImage className="w-3.5 h-3.5" /> Click image to zoom
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Amount" value={formatCurrency(Number(selected.amount))} />
              <InfoRow label="Reference" value={selected.reference_number || 'N/A'} />
            </div>
          </div>
        </div>
      )}
      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoom(null)}
        >
          <button
            onClick={() => setZoom(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoom}
            alt="Payment proof zoomed"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-medium truncate">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'text-amber-400 bg-amber-500/10', icon: <Clock className="w-3 h-3" /> },
    approved: { color: 'text-emerald-400 bg-emerald-500/10', icon: <Check className="w-3 h-3" /> },
    rejected: { color: 'text-red-400 bg-red-500/10', icon: <X className="w-3 h-3" /> },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${c.color}`}>
      {c.icon} {status}
    </span>
  );
}
