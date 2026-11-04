import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/types';
import { CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, Briefcase, Wallet, TrendingUp, ChevronRight, BarChart3, CalendarDays, Percent } from 'lucide-react';

interface AdminTab {
  id: 'recharges' | 'withdrawals' | 'cars' | 'users';
  label: string;
  icon: React.ReactNode;
}

interface RechargeRecord {
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface AnalyticsBucket {
  label: string;
  total: number;
  approved: number;
  approvalRate: number;
}

export default function AdminDashboard({ onNavigate }: { onNavigate: (tab: AdminTab['id']) => void }) {
  const [stats, setStats] = useState({
    pendingRecharges: 0,
    pendingWithdrawals: 0,
    activeRentals: 0,
    totalBalance: 0,
    totalUsers: 0,
    totalCars: 0,
  });
  const [dailyAnalytics, setDailyAnalytics] = useState<AnalyticsBucket[]>([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState<AnalyticsBucket[]>([]);
  const [analyticsView, setAnalyticsView] = useState<'daily' | 'weekly'>('daily');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [pendingRec, pendingWd, activeInv, users, cars, rechargeRows] = await Promise.all([
      supabase.from('recharge_logs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawal_logs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('investments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('recharge_logs').select('amount, status, created_at').order('created_at', { ascending: false }),
    ]);

    const { data: balanceData } = await supabase.from('profiles').select('wallet_balance');

    setStats({
      pendingRecharges: pendingRec.count || 0,
      pendingWithdrawals: pendingWd.count || 0,
      activeRentals: activeInv.count || 0,
      totalBalance: (balanceData || []).reduce((sum, p) => sum + Number(p.wallet_balance || 0), 0),
      totalUsers: users.count || 0,
      totalCars: cars.count || 0,
    });

    const records = (rechargeRows.data as RechargeRecord[]) || [];
    setDailyAnalytics(buildDailyBuckets(records));
    setWeeklyAnalytics(buildWeeklyBuckets(records));
    setAnalyticsLoading(false);
  }

  const quickActions: AdminTab[] = [
    { id: 'recharges', label: 'Pending Recharges', icon: <ArrowDownCircle className="w-5 h-5" /> },
    { id: 'withdrawals', label: 'Pending Withdrawals', icon: <ArrowUpCircle className="w-5 h-5" /> },
    { id: 'cars', label: 'Manage Cars', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'users', label: 'User Activity Logs', icon: <Wallet className="w-5 h-5" /> },
  ];

  const analytics = analyticsView === 'daily' ? dailyAnalytics : weeklyAnalytics;
  const totalAmount = analytics.reduce((sum, bucket) => sum + bucket.total, 0);
  const approvedAmount = analytics.reduce((sum, bucket) => sum + bucket.approved, 0);
  const reviewedBuckets = analytics.filter((bucket) => bucket.approvalRate >= 0);
  const approvalRate = reviewedBuckets.length > 0
    ? reviewedBuckets.reduce((sum, bucket) => sum + bucket.approvalRate, 0) / reviewedBuckets.length
    : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h2>
        <p className="text-gray-400 text-sm">Platform metrics and quick actions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<ArrowDownCircle className="w-6 h-6" />} label="Pending Recharges" value={String(stats.pendingRecharges)} color="text-amber-400" bg="bg-amber-500/10" onClick={() => onNavigate('recharges')} />
        <MetricCard icon={<ArrowUpCircle className="w-6 h-6" />} label="Pending Withdrawals" value={String(stats.pendingWithdrawals)} color="text-orange-400" bg="bg-orange-500/10" onClick={() => onNavigate('withdrawals')} />
        <MetricCard icon={<Briefcase className="w-6 h-6" />} label="Active Rentals" value={String(stats.activeRentals)} color="text-blue-400" bg="bg-blue-500/10" />
        <MetricCard icon={<Wallet className="w-6 h-6" />} label="Total Platform Balance" value={formatCurrency(stats.totalBalance)} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      <RechargeAnalytics
        buckets={analytics}
        view={analyticsView}
        loading={analyticsLoading}
        totalAmount={totalAmount}
        approvedAmount={approvedAmount}
        approvalRate={approvalRate}
        onChangeView={setAnalyticsView}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#131825] rounded-xl p-5 border border-[#232a3f]"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400"><TrendingUp className="w-5 h-5" /></div><div><p className="text-gray-400 text-xs">Total Users</p><p className="text-white text-xl font-bold">{stats.totalUsers}</p></div></div></div>
        <div className="bg-[#131825] rounded-xl p-5 border border-[#232a3f]"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400"><Briefcase className="w-5 h-5" /></div><div><p className="text-gray-400 text-xs">Total Cars Listed</p><p className="text-white text-xl font-bold">{stats.totalCars}</p></div></div></div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button key={action.id} onClick={() => onNavigate(action.id)} className="flex items-center justify-between bg-[#131825] rounded-xl p-4 border border-[#232a3f] hover:border-blue-500/40 transition-all group">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">{action.icon}</div><span className="text-white font-medium text-sm">{action.label}</span></div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RechargeAnalytics({ buckets, view, loading, totalAmount, approvedAmount, approvalRate, onChangeView }: {
  buckets: AnalyticsBucket[];
  view: 'daily' | 'weekly';
  loading: boolean;
  totalAmount: number;
  approvedAmount: number;
  approvalRate: number;
  onChangeView: (view: 'daily' | 'weekly') => void;
}) {
  const maxAmount = Math.max(...buckets.map((bucket) => bucket.total), 1);
  return (
    <section className="overflow-hidden rounded-2xl border border-[#232a3f] bg-[#131825]">
      <div className="flex flex-col gap-4 border-b border-[#232a3f] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-400" /><h3 className="font-semibold text-white">Recharge analytics</h3></div><p className="mt-1 text-xs text-gray-500">Submitted volume, approved credits, and review rate</p></div>
        <div className="flex gap-1 rounded-lg bg-[#0a0e1a] p-1"><button onClick={() => onChangeView('daily')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'daily' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}>Daily</button><button onClick={() => onChangeView('weekly')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'weekly' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}>Weekly</button></div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-5 pb-0"><AnalyticsStat icon={<Wallet className="h-4 w-4" />} label="Submitted" value={formatCurrency(totalAmount)} /><AnalyticsStat icon={<ArrowDownCircle className="h-4 w-4" />} label="Approved credit" value={formatCurrency(approvedAmount)} /><AnalyticsStat icon={<Percent className="h-4 w-4" />} label="Approval rate" value={`${Math.round(approvalRate)}%`} /></div>
      <div className="p-5">
        {loading ? <div className="h-48 animate-pulse rounded-xl bg-[#0a0e1a]" /> : <div className="flex h-48 items-end gap-2 rounded-xl bg-[#0a0e1a] p-4 sm:gap-3">{buckets.map((bucket) => <div key={bucket.label} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-36 w-full items-end justify-center"><div className="w-full max-w-10 rounded-t-md bg-blue-500/25 transition-all group-hover:bg-blue-500/40" style={{ height: `${Math.max((bucket.total / maxAmount) * 100, bucket.total ? 8 : 2)}%` }}><div className="h-full w-2/3 rounded-t-md bg-emerald-400 transition-all" style={{ height: `${bucket.total ? Math.max((bucket.approved / bucket.total) * 100, 4) : 0}%` }} /></div><div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg border border-[#334155] bg-[#1a2033] px-2 py-1 text-[10px] text-white group-hover:block">{formatCurrency(bucket.total)} total</div></div><span className="max-w-full truncate text-[10px] text-gray-500">{bucket.label}</span></div>)}</div>}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-500/40" /> Submitted</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Approved</span><span className="ml-auto flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {view === 'daily' ? 'Last 7 days' : 'Last 4 weeks'}</span></div>
      </div>
    </section>
  );
}

function AnalyticsStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-[#232a3f] bg-[#0a0e1a] p-3"><div className="mb-1 flex items-center gap-1.5 text-blue-400">{icon}<span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span></div><p className="truncate text-sm font-bold text-white">{value}</p></div>;
}

function buildDailyBuckets(records: RechargeRecord[]): AnalyticsBucket[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return makeBucket(date.toLocaleDateString('en-US', { weekday: 'short' }), records.filter((record) => isBetween(record.created_at, date, next)));
  });
}

function buildWeeklyBuckets(records: RechargeRecord[]): AnalyticsBucket[] {
  const now = new Date();
  return Array.from({ length: 4 }, (_, index) => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(now.getDate() - (3 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return makeBucket(`W${index + 1}`, records.filter((record) => isBetween(record.created_at, start, new Date(end.getTime() + 1))));
  });
}

function isBetween(value: string, start: Date, end: Date): boolean {
  const date = new Date(value);
  return date >= start && date < end;
}

function makeBucket(label: string, records: RechargeRecord[]): AnalyticsBucket {
  const total = records.reduce((sum, record) => sum + Number(record.amount), 0);
  const approved = records.filter((record) => record.status === 'approved').reduce((sum, record) => sum + Number(record.amount), 0);
  const reviewed = records.filter((record) => record.status === 'approved' || record.status === 'rejected');
  const approvalRate = reviewed.length > 0 ? records.filter((record) => record.status === 'approved').length / reviewed.length * 100 : 0;
  return { label, total, approved, approvalRate };
}

function MetricCard({ icon, label, value, color, bg, onClick }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`bg-[#131825] rounded-xl p-5 border border-[#232a3f] ${onClick ? 'cursor-pointer hover:border-blue-500/40 transition-all' : ''}`}><div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color} mb-3`}>{icon}</div><p className="text-gray-400 text-xs mb-1">{label}</p><p className="text-white text-2xl font-bold">{value}</p></div>;
}