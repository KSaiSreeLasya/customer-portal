import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { User } from '../types';

export default function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLogin(data.user, data.token);
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
            <h2 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h2>
            <p className="text-[#616161]">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-12 p-6 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E5]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] mb-2 underline decoration-black/20">Demo Credentials</p>
            <div className="flex justify-between text-sm">
              <span className="text-[#616161]">Email: admin@example.com</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
