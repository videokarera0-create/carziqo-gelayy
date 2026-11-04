import { useAuth } from '@/context/AuthContext';
import { Car, Chrome as Home, Briefcase, User, LogOut, Gift, Leaf, Info, History, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import UserDashboard from '@/pages/user/UserDashboard';
import CarStore from '@/pages/user/CarStore';
import MyRentals from '@/pages/user/MyRentals';
import UserProfile from '@/pages/user/UserProfile';
import Rewards from '@/pages/user/Rewards';
import RechargeHistory from '@/pages/user/RechargeHistory';
import UserChatWidget from '@/components/UserChatWidget';
import { useAccentColor } from '@/lib/useAccentColor';

type Tab = 'home' | 'store' | 'rentals' | 'history' | 'rewards' | 'profile';

export default function UserApp({ onShowAbout }: { onShowAbout: () => void }) {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const accent = useAccentColor();

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'store', label: 'Car Store', icon: <Car className="w-5 h-5" /> },
    { id: 'rentals', label: 'Rentals', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="glass-strong sticky top-0 z-40 border-b" style={{ borderColor: `${accent}40` }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/assets/images/waymo-removebg-preview.png" alt="WAYMO" className="w-9 h-9 rounded-lg object-contain bg-white p-1 shadow-lg" style={{ boxShadow: `0 4px 12px ${accent}30` }} />
            <div>
              <h1 className="font-bold text-white text-sm text-gradient-shine">WAYMO</h1>
              <p className="text-[10px] text-gray-400">Welcome, {profile?.full_name || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowAbout}
              className="w-9 h-9 rounded-lg bg-[#131825]/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              title="About"
            >
              <Info className="w-4 h-4" />
            </button>
            {profile && profile.carbon_points > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold">{profile.carbon_points}</span>
              </div>
            )}
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-[#131825]/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-6 pb-24">
        {tab === 'home' && <UserDashboard />}
        {tab === 'store' && <CarStore />}
        {tab === 'rentals' && <MyRentals />}
        {tab === 'history' && <RechargeHistory />}
        {tab === 'rewards' && <Rewards />}
        {tab === 'profile' && <UserProfile />}
      </main>

      <UserChatWidget />

      {/* Bottom nav */}
      <nav className="glass-strong fixed bottom-0 left-0 right-0 border-t border-[#232a3f]/80 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
              style={tab === item.id ? { color: accent } : undefined}
            >
              <div className="p-1.5 rounded-lg transition-all" style={tab === item.id ? { background: `${accent}20`, boxShadow: `0 2px 8px ${accent}20` } : undefined}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
