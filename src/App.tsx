import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AuthPage from '@/pages/AuthPage';
import AboutPage from '@/pages/AboutPage';
import UserApp from '@/pages/user/UserApp';
import AdminApp from '@/pages/admin/AdminApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LiveBackground from '@/components/LiveBackground';
import { useState } from 'react';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

  if (showAbout) {
    return (
      <>
        <LiveBackground />
        <div className="relative z-10">
          <AboutPage onBack={() => setShowAbout(false)} />
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthPage onShowAbout={() => setShowAbout(true)} />;
  }

  if (profile.role === 'admin') {
    return (
      <>
        <LiveBackground />
        <div className="relative z-10">
          <AdminApp onShowAbout={() => setShowAbout(true)} />
        </div>
      </>
    );
  }

  return (
    <>
      <LiveBackground />
      <div className="relative z-10">
        <UserApp onShowAbout={() => setShowAbout(true)} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
