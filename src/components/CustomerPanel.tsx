import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, FolderKanban, Users, Search, Filter } from 'lucide-react';
import { Project, User } from '../types';
import { SOLAR_STAGES } from '../constants';
import { StatusPipeline } from './StatusPipeline';

export default function CustomerPanel({ user, token }: { user: User; token: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!token || token.trim() === '') {
      console.warn('No valid token available for customer');
      setError('Authentication token missing. Please login again.');
      setLoading(false);
      return;
    }

    console.log('Token available, fetching projects');
    fetchProjects();
  }, [token]);

  const handleAuthError = () => {
    // Clear invalid token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects with token length:', token?.length);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const res = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', res.status, res.statusText);

      // Handle authentication errors - invalid or expired token
      if (res.status === 401 || res.status === 403) {
        console.warn('Authentication failed - invalid or expired token');
        handleAuthError();
        return;
      }

      // Try to parse error response
      let errorMsg = '';
      if (!res.ok) {
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || `HTTP ${res.status}: ${res.statusText || 'Unknown'}`;
        } catch {
          errorMsg = `HTTP ${res.status}: ${res.statusText || 'Unknown error'}`;
        }
        throw new Error(`Server error: ${errorMsg}`);
      }

      const data = await res.json();
      console.log('Projects fetched successfully:', data?.length || 0, 'projects');
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.message || err.toString() || 'Unknown error occurred';
      console.error('Customer fetch error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-8 border-b border-line-muted">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9E9E9E]">Live Telemetry</p>
          </div>
          <h1 className="text-6xl font-display font-bold tracking-tighter leading-none mb-4">Project Pipeline</h1>
          <p className="text-[#616161] font-medium max-w-xl">Real-time vector tracking of your registered residential solar system deployments.</p>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-[24px] text-xs font-bold uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          System Error: {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-[24px] border border-line-muted shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary/20" size={20} />
          <input
            type="text"
            placeholder="Search operational index..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-transparent border-none rounded-2xl focus:ring-0 transition-all text-sm font-bold placeholder:text-[#9E9E9E] outline-none"
          />
        </div>
        <div className="flex items-center gap-2 group p-2 pr-4 bg-surface-bg rounded-2xl border border-line-muted">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-primary/40 border border-line-muted">
            <Filter size={18} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none rounded-xl py-2 text-xs font-black uppercase tracking-widest focus:ring-0 transition-all cursor-pointer outline-none"
          >
            <option value="All">All Phases</option>
            {SOLAR_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-line-muted p-32 text-center shadow-sm">
          <div className="w-20 h-20 bg-surface-bg rounded-3xl flex items-center justify-center text-brand-primary/10 mx-auto mb-8">
            <FolderKanban size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold tracking-tight mb-2">No Active Streams</h2>
          <p className="text-[#9E9E9E] font-medium">
            {projects.length === 0 
              ? "Awaiting regional synchronization for your node credentials."
              : "No telemetry data matches your current search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number; key?: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-[48px] border border-line-muted p-12 hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="flex flex-col gap-12 relative z-10">
        {/* Header Info */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 border-b border-line-muted pb-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <StatusBadge status={project.status} />
              <span className="text-[10px] font-black font-mono text-[#9E9E9E] bg-surface-bg px-3 py-1 rounded-lg border border-line-muted uppercase">SYS_REF: {project.id.toString().slice(0, 8)}</span>
            </div>
            <h2 className="text-6xl font-display font-bold tracking-tighter leading-[0.9] group-hover:translate-x-1 transition-transform duration-500">{project.name}</h2>
            <div className="p-6 bg-surface-bg rounded-[24px] border border-line-muted max-w-2xl">
              <p className="text-lg text-[#616161] leading-relaxed font-medium">
                {project.description || 'System generated project node for your renewable energy transition.'}
              </p>
            </div>
          </div>
          
          <div className="text-right shrink-0">
             <div className="p-8 bg-brand-primary rounded-[32px] text-white shadow-xl shadow-black/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Total Investment</p>
                <p className="text-5xl font-display font-bold tracking-tighter leading-none">
                   <span className="text-brand-accent text-3xl mr-1 italic serif">₹</span>
                   {(project.proposal_amount || 0).toLocaleString()}
                </p>
             </div>
          </div>
        </div>

        {/* Financial Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-surface-bg p-8 rounded-[32px] border border-line-muted">
          <FinanceDetail label="ALLOCATED" value={project.proposal_amount} />
          <FinanceDetail label="RETAINER" value={project.advance_amount || project.advance_payment || project.advance_amt} />
          <FinanceDetail label="SETTLED" value={project.paid_amount} />
          <FinanceDetail label="OUTSTANDING" value={(project.proposal_amount || 0) - (project.advance_payment || project.advance_amount || project.advance_amt || 0) - (project.paid_amount || 0)} highlight />
        </div>

        {/* Timeline Pipeline */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] px-4">Phase Sequence</h3>
           <div className="bg-surface-bg rounded-[40px] p-2 border border-line-muted shadow-inner" key={`${project.id}-${project.status}`}>
              <StatusPipeline currentStatus={project.status} />
           </div>
        </div>

        {/* Tracking Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-10 border-t border-line-muted">
          <div className="flex items-center gap-12">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Authorization</p>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Customer Verified</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Final Update</p>
              <div className="flex items-center gap-3 text-xs font-black font-mono">
                <Clock size={16} className="text-brand-accent" /> {new Date(project.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-1">Total Completion</p>
                <div className="text-5xl font-display font-black tracking-tighter text-brand-primary">{project.progress}%</div>
             </div>
             <div className="w-48 h-2 bg-surface-bg rounded-full overflow-hidden border border-line-muted p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  className="h-full bg-brand-primary rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
                />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FinanceDetail({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
   return (
      <div>
         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-2">{label}</p>
         <p className={`text-xl font-mono font-black ${highlight ? 'text-rose-600' : 'text-brand-primary'}`}>
            ₹{(value || 0).toLocaleString()}
         </p>
      </div>
   );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Site Visit': 'text-neutral-500 border-neutral-200 bg-neutral-50',
    'Proposal': 'text-blue-500 border-blue-200 bg-blue-50',
    'eKYC': 'text-indigo-500 border-indigo-200 bg-indigo-50',
    'Payment': 'text-emerald-500 border-emerald-200 bg-emerald-50',
    'Approvals': 'text-amber-500 border-amber-200 bg-amber-50',
    'Material': 'text-orange-500 border-orange-200 bg-orange-50',
    'Installation': 'text-cyan-500 border-cyan-200 bg-cyan-50',
    'Net Meter': 'text-purple-500 border-purple-200 bg-purple-50',
    'Subsidy': 'text-rose-500 border-rose-200 bg-rose-50',
  };

  const style = styles[status] || 'text-neutral-500 border-neutral-200 bg-neutral-50';

  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${style} shadow-sm inline-flex items-center gap-2`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.split(' ')[0].replace('text', 'bg')} animate-pulse`} />
      {status}
    </span>
  );
}
