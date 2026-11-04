import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LiveBackground from '@/components/LiveBackground';
import FleetTicker from '@/components/FleetTicker';
import { useAccentColor } from '@/lib/useAccentColor';
import { Eye, EyeOff, TrendingUp, Shield, Wallet, Gift, Info, Download, Car, Cpu, Leaf, Globe, Users } from 'lucide-react';

export default function AuthPage({ onShowAbout }: { onShowAbout: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const accentColor = useAccentColor();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, phone, referralCode || undefined);
      if (error) {
        if (error.includes('Database error') || error.includes('User already registered')) {
          setError('This email is already registered. Try signing in instead.');
        } else {
          setError(error);
        }
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <LiveBackground />

      {/* Left side - branding */}
      <div className="lg:w-1/2 relative overflow-hidden flex items-center justify-center p-8 lg:p-16 z-10">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s', backgroundColor: `${accentColor}40` }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-200 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 80%)',
        }} />
        <div className="relative z-10 max-w-md text-white overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin pr-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/95 p-1 shadow-xl">
              <img src="/assets/images/waymo-removebg-preview.png" alt="WAYMO" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-shine">WAYMO</h1>
              <p className="text-blue-100 text-sm">Car Rental Earning Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3 leading-tight">
            The world's most trusted driver.
          </h2>
          <p className="text-blue-100 text-base mb-8 leading-relaxed">
            WAYMO is united by the belief that autonomous driving technology can make a meaningful difference — transforming lives through safer, more sustainable, and more accessible transportation for all.
          </p>

          {/* Live fleet ticker */}
          <div className="mb-8">
            <FleetTicker accentColor={accentColor} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard value="10+" label="Years of Innovation" accentColor={accentColor} />
            <StatCard value="24/7" label="Autonomous Fleet" accentColor={accentColor} />
            <StatCard value="100%" label="Electric Vehicles" accentColor={accentColor} />
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <FeatureRow icon={<TrendingUp className="w-5 h-5" />} title="Up to 3% daily returns" desc="Competitive rates on premium car rentals" />
            <FeatureRow icon={<Cpu className="w-5 h-5" />} title="The Waymo Driver" desc="Fully autonomous technology with integrated sensors and real-time compute" />
            <FeatureRow icon={<Shield className="w-5 h-5" />} title="Safety first culture" desc="Advancing safely is our core value — robust standards on every ride" />
            <FeatureRow icon={<Wallet className="w-5 h-5" />} title="Flexible withdrawal" desc="Cash out your earnings anytime with admin-verified payouts" />
            <FeatureRow icon={<Leaf className="w-5 h-5" />} title="Sustainable mobility" desc="All-electric fleet reducing carbon emissions on every trip" />
            <FeatureRow icon={<Globe className="w-5 h-5" />} title="Global expansion" desc="Now operating across multiple cities and countries worldwide" />
          </div>

          {/* Mission quote */}
          <div className="backdrop-blur-md rounded-2xl p-5 border mb-8" style={{ background: `${accentColor}12`, borderColor: `${accentColor}30` }}>
            <p className="text-white text-sm italic leading-relaxed mb-3">
              "We are doing more than just navigating roads — we are building the systems that interact with the world around us."
            </p>
            <p className="text-xs font-semibold" style={{ color: accentColor }}>— Vincent Vanhoucke, Distinguished Engineer</p>
          </div>

          {/* How it works mini-section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border mb-8" style={{ borderColor: `${accentColor}20` }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Car className="w-4 h-4" style={{ color: accentColor }} /> How WAYMO Works
            </h3>
            <div className="space-y-2.5">
              <StepRow num="1" text="Choose a premium car from our fleet" accentColor={accentColor} />
              <StepRow num="2" text="Invest with flexible 30 or 60 day plans" accentColor={accentColor} />
              <StepRow num="3" text="Earn daily returns straight to your wallet" accentColor={accentColor} />
              <StepRow num="4" text="Withdraw anytime — verified and secure" accentColor={accentColor} />
            </div>
          </div>

          {/* Community */}
          <div className="flex items-center gap-3 text-blue-100 text-sm">
            <Users className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
            <span>Join a growing community of investors shaping the future of mobility.</span>
          </div>
        </div>
      </div>

      {/* Right side - auth form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-transparent relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login'
                ? 'Sign in to manage your investments'
                : 'Start earning daily returns today'}
            </p>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-[#131825]/80 backdrop-blur-xl rounded-xl border border-[#232a3f]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'gradient-primary text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'gradient-primary text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Full Name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-field"
                    placeholder="John Doe"
                  />
                </Field>
                <Field label="Phone Number">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder="+1 234 567 890"
                  />
                </Field>
                <Field label="Referral Code (Optional)">
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="input-field pl-10 uppercase"
                      placeholder="Enter referral code"
                      maxLength={6}
                    />
                  </div>
                </Field>
              </>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 btn-glow"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>

          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-6 flex items-center justify-center gap-2 gradient-accent text-white font-semibold py-3.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <Download className="w-5 h-5" /> Download Our App
          </a>

          <button
            onClick={onShowAbout}
            className="w-full mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm hover:text-blue-400 transition-colors"
          >
            <Info className="w-4 h-4" /> About WAYMO
          </button>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: rgba(19, 24, 37, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid #232a3f;
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #0066ff;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }
        .input-field::placeholder {
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {children}
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm transition-all group-hover:bg-white/25 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-blue-100 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, accentColor }: { value: string; label: string; accentColor: string }) {
  return (
    <div className="backdrop-blur-sm rounded-xl p-3 text-center border" style={{ background: `${accentColor}12`, borderColor: `${accentColor}25` }}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-blue-100 text-[10px] mt-1 leading-tight">{label}</p>
    </div>
  );
}

function StepRow({ num, text, accentColor }: { num: string; text: string; accentColor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}25`, color: accentColor }}>{num}</span>
      <span className="text-blue-100 text-sm">{text}</span>
    </div>
  );
}
