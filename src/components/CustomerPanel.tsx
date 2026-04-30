import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, FolderKanban, Users, Search, Filter } from 'lucide-react';
import { Project, User } from '../types';
import { SOLAR_STAGES, STAGE_PROGRESS } from '../constants';
import { supabase } from '../lib/supabase';
import { StatusPipeline } from './StatusPipeline';

export default function CustomerPanel({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload: any) => {
          // Check if this project belongs to the current user
          if (payload.new && payload.new.customer_name === user.name && payload.new.phone === user.phone) {
            fetchProjects();
          } else if (payload.old && payload.old.customer_name === user.name) {
             // Handle deletes or re-assignments
             fetchProjects();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.name, user.phone]);

  const fetchProjects = async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('projects')
        .select('*')
        .eq('customer_name', user.name)
        .eq('phone', user.phone);
      
      if (sbError) throw sbError;
      
      // Manually calculate progress to avoid DB column dependency
      const processedProjects = (data || []).map(p => {
        const status = (p.status || 'Site Visit').trim();
        const progress = STAGE_PROGRESS[status as keyof typeof STAGE_PROGRESS] || 
                        STAGE_PROGRESS['Site Visit'];
        return {
          ...p,
          status,
          progress
        };
      });

      setProjects(processedProjects);
      setError(null);
    } catch (err: any) {
      console.error('Customer fetch error:', err);
      setError(err.message || 'Failed to fetch projects from Supabase');
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
          <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter leading-none mb-4">Project Pipeline</h1>
          <p className="text-sm lg:text-base text-[#616161] font-medium max-w-xl">Real-time vector tracking of your registered residential solar system deployments.</p>
        </div>

        <div className="flex p-1.5 bg-white rounded-2xl border border-line-muted shadow-sm self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('Dashboard')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'Dashboard' ? 'bg-brand-primary text-white shadow-lg' : 'text-[#9E9E9E] hover:text-brand-primary'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('Analytics')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'Analytics' ? 'bg-brand-primary text-white shadow-lg' : 'text-[#9E9E9E] hover:text-brand-primary'}`}
          >
            Analytics
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-[24px] text-xs font-bold uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          System Error: {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'Dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
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
          </motion.div>
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-white rounded-[40px] p-24 border border-line-muted shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[600px]"
          >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/20 blur-[100px] -mr-48 -mt-48 rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] -ml-32 -mb-32 rounded-full" />
            
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -10, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-[32px] bg-surface-bg border border-line-muted flex items-center justify-center text-brand-primary mb-10 relative z-10"
            >
              <div className="w-12 h-12 rounded-full border-4 border-t-brand-accent-dark border-r-transparent border-b-transparent border-l-transparent animate-spin absolute" />
              <Search size={32} className="text-brand-primary/20" />
            </motion.div>

            <h2 className="text-4xl lg:text-7xl font-display font-bold tracking-tighter text-brand-primary mb-6 relative z-10">
              COMING <span className="text-brand-accent serif italic">SOON</span>
            </h2>
            
            <div className="max-w-md relative z-10 space-y-8 p-4 lg:p-0">
              <p className="text-base lg:text-xl font-bold text-[#616161] leading-relaxed">
                Our spectral yield analysis engine is currently synthesizing regional solar radiation vector data.
              </p>
              <div className="flex gap-3 justify-center">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-1.5 w-12 bg-surface-bg border border-line-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="h-full w-full bg-brand-accent-dark shadow-[0_0_8px_rgba(255,193,7,0.5)]"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4 p-8 border border-line-muted rounded-[32px] bg-surface-bg inline-block">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary leading-none">
                  Predictive Maintenance & ROI Module
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number; key?: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-[32px] lg:rounded-[48px] p-6 lg:p-12 hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 group relative overflow-hidden border border-line-muted"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="flex flex-col gap-8 lg:gap-12 relative z-10">
        {/* Header Info */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-8 border-b border-line-muted pb-8 lg:pb-10">
          <div className="space-y-4 lg:space-y-6 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={project.status} />
              <span className="text-[10px] font-black font-mono text-[#9E9E9E] bg-surface-bg px-3 py-1 rounded-lg border border-line-muted uppercase">SYS_REF: {project.id.toString().slice(0, 8)}</span>
            </div>
            <h2 className="text-3xl lg:text-6xl font-display font-bold tracking-tighter leading-[0.9] group-hover:translate-x-1 transition-transform duration-500 text-brand-primary">{project.name}</h2>
            <div className="p-5 lg:p-6 bg-surface-bg rounded-[24px] border border-line-muted w-full max-w-2xl">
              <p className="text-sm lg:text-lg text-[#616161] leading-relaxed font-medium">
                {project.description || 'System generated project node for your renewable energy transition.'}
              </p>
            </div>
          </div>
          
          <div className="text-left lg:text-right shrink-0 w-full lg:w-auto">
             <div className="p-6 lg:p-8 bg-brand-primary rounded-[28px] lg:rounded-[32px] text-white shadow-xl shadow-black/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Total Investment</p>
                <p className="text-3xl lg:text-5xl font-display font-bold tracking-tighter leading-none">
                   <span className="text-brand-accent text-2xl lg:text-3xl mr-1 italic serif">₹</span>
                   {(project.proposal_amount || 0).toLocaleString()}
                </p>
             </div>
          </div>
        </div>

        {/* Financial Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 bg-surface-bg p-6 lg:p-8 rounded-[28px] lg:rounded-[32px] border border-line-muted">
          <FinanceDetail label="ALLOCATED" value={project.proposal_amount} />
          <FinanceDetail label="RETAINER" value={project.advance_amount || project.advance_payment || project.advance_amt} />
          <FinanceDetail label="SETTLED" value={project.paid_amount} />
          <FinanceDetail label="OUTSTANDING" value={(project.proposal_amount || 0) - (project.advance_payment || project.advance_amount || project.advance_amt || 0) - (project.paid_amount || 0)} highlight />
        </div>

        {/* Timeline Pipeline */}
        <div className="space-y-4 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] px-2 lg:px-4">Phase Sequence</h3>
           <div className="bg-surface-bg rounded-[32px] lg:rounded-[40px] p-2 border border-line-muted shadow-inner min-w-[600px] lg:min-w-0" key={`${project.id}-${project.status}`}>
              <StatusPipeline currentStatus={project.status} />
           </div>
        </div>

        {/* Tracking Footer */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-10 pt-8 lg:pt-10 border-t border-line-muted">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12 w-full lg:w-auto">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Authorization</p>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Customer Verified</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Technical Sync</p>
              <div className="flex items-center gap-3 text-xs font-black font-mono">
                <Clock size={16} className="text-brand-accent" /> 
                {project.updated_at 
                  ? new Date(project.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase() 
                  : 'INITIALIZING...'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto justify-between lg:justify-end">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-1">Total Completion</p>
                <div className="text-3xl lg:text-5xl font-display font-black tracking-tighter text-brand-primary">{project.progress}%</div>
             </div>
             <div className="w-32 lg:w-48 h-1.5 lg:h-2 bg-surface-bg rounded-full overflow-hidden border border-line-muted p-0.5">
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
