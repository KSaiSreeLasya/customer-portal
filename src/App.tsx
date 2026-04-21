import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, LayoutDashboard, Users, FolderKanban, ChevronRight, Plus, CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { User, Project } from './types';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
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

function Layout({ user, children, onLogout }: { user: User; children: React.ReactNode; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans">
      {/* Sidebar / Nav */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-[#E5E5E5] p-6 z-10 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded flex items-center justify-center">
              <FolderKanban className="text-white w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">SolarInstall</span>
          </div>

          <div className="space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active onClick={() => navigate('/')} />
            {user.role === 'admin' && (
              <>
                <NavItem icon={<Users size={18} />} label="Customers" onClick={() => {}} />
                <NavItem icon={<FolderKanban size={18} />} label="Installations" onClick={() => {}} />
              </>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E5E5]">
          <div className="mb-4 px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-1">User Profile</p>
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-[#9E9E9E] truncate">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-[#9E9E9E] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="pl-64 min-h-screen p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
        active ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10' : 'text-[#616161] hover:bg-white hover:text-[#1A1A1A]'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}
