import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, LayoutDashboard, Users, FolderKanban, ChevronRight, Plus, CheckCircle2, Clock, PlayCircle, Loader2, ArrowLeft } from 'lucide-react';
import { User, Project } from './types';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('Overview');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/*"
          element={
            user ? (
              <Layout 
                user={user} 
                onLogout={handleLogout} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              >
                <Dashboard user={user} activeTab={activeTab} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function Layout({ user, children, onLogout, activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: { 
  user: User; 
  children: React.ReactNode; 
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-bg text-brand-primary font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-line-muted px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <FolderKanban className="text-brand-accent w-5 h-5" />
          </div>
          <h1 className="font-display font-bold text-lg tracking-tight">HELIO</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center text-brand-primary"
        >
          <Plus className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45' : ''}`} size={20} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
          />
        )}
      </AnimatePresence>

      {/* Sidebar / Nav */}
      <nav className={`fixed top-16 lg:top-0 left-0 h-[calc(100%-4rem)] lg:h-full w-72 bg-white border-r border-line-muted p-8 z-30 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="hidden lg:flex items-center gap-4 px-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <FolderKanban className="text-brand-accent w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight leading-none">HELIO</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9E9E9E] mt-0.5">Systems</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9E9E9E] px-4 mb-4">Workspace</p>
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Overview" 
              active={activeTab === 'Overview'} 
              onClick={() => { setActiveTab('Overview'); navigate('/'); setIsMobileMenuOpen(false); }} 
            />
            {user.role === 'admin' && (
              <>
                <NavItem 
                  icon={<Users size={20} />} 
                  label="Customers" 
                  active={activeTab === 'Customers'} 
                  onClick={() => { setActiveTab('Customers'); navigate('/'); setIsMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<FolderKanban size={20} />} 
                  label="Installations" 
                  active={activeTab === 'Installations'} 
                  onClick={() => { setActiveTab('Installations'); navigate('/'); setIsMobileMenuOpen(false); }} 
                />
              </>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-line-muted">
          <div className="mb-6 px-4 py-4 bg-brand-primary/5 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-2">Authenticator</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-accent font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider font-semibold">{user.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[#9E9E9E] hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all duration-300 group"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="font-bold text-sm">Terminate Session</span>
          </button>
        </div>
      </nav>

      <main className="lg:pl-72 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab !== 'Overview' && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setActiveTab('Overview');
                    navigate('/');
                  }}
                  className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 hover:text-brand-primary transition-colors group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-line-muted flex items-center justify-center group-hover:border-brand-primary transition-colors">
                    <ArrowLeft size={14} />
                  </div>
                  Return to Matrix
                </motion.button>
              )}
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-300 group ${
        active 
          ? 'bg-brand-primary text-white shadow-xl shadow-black/20 translate-x-1' 
          : 'text-[#616161] hover:bg-brand-primary/5 hover:text-brand-primary'
      }`}
    >
      <span className={`${active ? 'text-brand-accent' : 'text-[#9E9E9E] group-hover:text-brand-primary'} transition-colors`}>
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(255,212,59,0.8)]" 
        />
      )}
    </button>
  );
}
