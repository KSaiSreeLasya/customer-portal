import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Decoration */}
      <div className="hidden md:flex md:w-1/2 bg-[#1A1A1A] p-16 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-[#1A1A1A] rounded-full" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tighter">SolarInstall</span>
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white text-7xl font-semibold tracking-tighter leading-tight"
          >
            Track your <br/>solar journey <br/><span className="text-[#9E9E9E]">effortlessly.</span>
          </motion.h1>
        </div>

        <div className="z-10 text-white/50 text-sm font-medium">
          © 2026 Customer Portal Pro. All rights reserved.
        </div>

        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-12 gap-1 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border-r border-b border-white" />
            ))}
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <div className="flex bg-[#F5F5F4] p-1 rounded-xl mb-8">
              <button 
                onClick={() => { setMode('customer'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'customer' ? 'bg-white shadow-sm text-black' : 'text-[#9E9E9E]'}`}
              >
                Customer Portal
              </button>
              <button 
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-black' : 'text-[#9E9E9E]'}`}
              >
                Admin Access
              </button>
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-2">
              {mode === 'admin' ? 'Staff Login' : 'Project Lookup'}
            </h2>
            <p className="text-[#616161]">
              {mode === 'admin' ? 'Enter your credentials to manage project pipelines.' : 'Enter your project details to check your installation status.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'admin' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F5F5F4] border-none rounded-xl px-12 py-4 focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                      placeholder="admin@example.com"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F5F5F4] border-none rounded-xl px-12 py-4 focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2">Customer Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#F5F5F4] border-none rounded-xl px-12 py-4 focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                      placeholder="e.g. John Doe"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] opacity-0" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#F5F5F4] border-none rounded-xl px-12 py-4 focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                      placeholder="Enter registered phone"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] opacity-0" size={20} />
                  </div>
                </div>
              </>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm font-medium"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 font-semibold text-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>{mode === 'admin' ? 'Sign In' : 'Look Up Project'} <ArrowRight size={20} /></>}
            </button>
          </form>

          {mode === 'admin' ? (
            <div className="mt-12 p-6 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E5]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2 underline decoration-black/20">Staff Test Account</p>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#616161]">Email: admin@example.com</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">admin123</span>
              </div>
            </div>
          ) : (
            <div className="mt-12 p-6 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E5]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2 underline decoration-black/20">Sample Customer Info</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#616161]">Name:</span>
                  <span className="font-medium text-black">John Doe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#616161]">Phone:</span>
                  <span className="font-medium text-black">9876543210</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
