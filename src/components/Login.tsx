import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight, FolderKanban } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<'admin' | 'customer'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'admin') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON login response:', text);
          throw new Error(`Server error (${res.status}). Please try again later.`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        onLogin(data.user, data.token);
      } else {
        // Customer Mode: Direct Supabase Lookup
        const { data: projects, error: sbError } = await supabase
          .from('projects')
          .select('*')
          .eq('customer_name', customerName)
          .eq('phone', phone)
          .limit(1);

        if (sbError) throw sbError;

        if (!projects || projects.length === 0) {
          throw new Error('No project found with these details. Please contact your administrator.');
        }

        const mockUser: User = {
          id: `cust_${phone}`,
          name: customerName,
          phone: phone,
          role: 'customer'
        };
        onLogin(mockUser, 'supabase-anon-token');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans select-none">
      {/* Brand Side */}
      <div className="hidden md:flex md:w-3/5 bg-brand-primary p-24 flex-col justify-between relative overflow-hidden">
        {/* Abstract Solar Graphic */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-[80px]" />
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center">
              <FolderKanban className="text-brand-primary w-7 h-7" />
            </div>
            <h1 className="font-display font-black text-3xl tracking-tighter text-white">HELIO<span className="text-brand-accent">.</span></h1>
          </div>
          <div className="h-0.5 w-12 bg-brand-accent" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-xl"
        >
          <h2 className="text-6xl font-display font-bold text-white leading-none tracking-tight mb-8">
            Advanced <br />
            <span className="text-brand-accent">Solar Workflow</span> <br />
            Orchestration.
          </h2>
          <p className="text-lg text-white/50 leading-relaxed font-medium">
            The professional standard for managing residential solar system deployments. Precision tracking from site visit to final subsidy.
          </p>
        </motion.div>

        <div className="relative z-10 flex gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">System Status</p>
            <p className="text-brand-accent font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
              All Systems Operational
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Network</p>
            <p className="text-white font-bold text-sm">Mainframe-01 / Global</p>
          </div>
        </div>
      </div>

      {/* Login Side */}
      <div className="w-full md:w-2/5 flex items-center justify-center p-8 bg-surface-bg relative">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <div className="flex bg-white p-1.5 rounded-2xl mb-12 shadow-sm border border-line-muted">
              <button 
                onClick={() => { setMode('customer'); setError(''); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'customer' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-primary/40 hover:text-brand-primary'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'admin' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-primary/40 hover:text-brand-primary'}`}
              >
                Admin
              </button>
            </div>

            <h3 className="text-3xl font-display font-bold tracking-tight text-brand-primary mb-3">
              {mode === 'admin' ? 'Staff Authentication' : 'Project Pipeline'}
            </h3>
            <p className="text-[#616161] font-medium text-sm">
              {mode === 'admin' ? 'Access administrative controls and pipeline management.' : 'Retrieve your installation status using registered credentials.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'admin' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] ml-1">Access Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-line-muted rounded-xl px-12 py-4 font-bold text-sm focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-black/20"
                      placeholder="admin@helio.com"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] ml-1">Secure Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-line-muted rounded-xl px-12 py-4 font-bold text-sm focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-black/20"
                      placeholder="••••••••"
                      required
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20" size={18} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] ml-1">Registered Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-line-muted rounded-xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-black/20"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] ml-1">Contact Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-line-muted rounded-xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-black/20"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>{mode === 'admin' ? 'Authorize' : 'Retrieve Data'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {mode === 'admin' ? (
            <div className="mt-12 p-6 bg-white rounded-2xl border border-line-muted shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-4">Debug Access</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-surface-bg p-3 rounded-lg border border-line-muted">
                  <span className="text-[10px] font-bold text-[#616161]">EMAIL</span>
                  <span className="text-[10px] font-mono font-bold text-brand-primary">admin@example.com</span>
                </div>
                <div className="flex justify-between items-center bg-surface-bg p-3 rounded-lg border border-line-muted">
                  <span className="text-[10px] font-bold text-[#616161]">PWD</span>
                  <span className="text-[10px] font-mono font-bold text-brand-primary">admin123</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 p-6 bg-white rounded-2xl border border-line-muted shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-4">Live Test Context</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-surface-bg p-3 rounded-lg border border-line-muted">
                  <span className="text-[10px] font-bold text-[#616161]">CS_NAME</span>
                  <span className="text-[10px] font-bold text-brand-primary">John Doe</span>
                </div>
                <div className="flex justify-between items-center bg-surface-bg p-3 rounded-lg border border-line-muted">
                  <span className="text-[10px] font-bold text-[#616161]">CS_PHONE</span>
                  <span className="text-[10px] font-bold text-brand-primary">9876543210</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
