import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, FolderKanban, Users, Search, Filter } from 'lucide-react';
import { Project } from '../types';
import { SOLAR_STAGES } from '../constants';
import { supabase } from '../lib/supabase';

export default function CustomerPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('projects')
        .select('*');
      
      if (sbError) throw sbError;
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
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
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-2">Project Tracker</h1>
          <p className="text-[#616161] font-medium">Real-time progress overview of your assigned projects.</p>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium">
          Error: {error}. Please check your Supabase table name ("projects") and RLS policies.
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-[#E5E5E5]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-[#9E9E9E]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F5F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A1A1A] transition-all font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {SOLAR_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-20 text-center">
          <FolderKanban className="w-16 h-16 mx-auto mb-6 text-[#9E9E9E]" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">No projects found</h2>
          <p className="text-[#9E9E9E]">
            {projects.length === 0 
              ? "We'll notify you once a project is assigned to your account."
              : "No projects match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number; key?: any }) {
  const statusConfig: Record<string, { icon: React.ReactElement, color: string, bg: string }> = {
    'Site Visit': { icon: <Clock size={20} />, color: 'text-neutral-500', bg: 'bg-neutral-50' },
    'Proposal': { icon: <PlayCircle size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    'eKYC': { icon: <Users size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'Payment': { icon: <CheckCircle2 size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'Approvals': { icon: <Clock size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    'Material': { icon: <FolderKanban size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' },
    'Installation': { icon: <PlayCircle size={20} />, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    'Net Meter': { icon: <PlayCircle size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' },
    'Subsidy': { icon: <CheckCircle2 size={20} />, color: 'text-rose-500', bg: 'bg-rose-50' }
  };

  const config = statusConfig[project.status] || statusConfig['Site Visit'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[40px] border border-[#E5E5E5] p-10 hover:border-[#1A1A1A] transition-all duration-300 group shadow-sm hover:shadow-2xl hover:shadow-black/5"
    >
      <div className="flex flex-col gap-10">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-[#F5F5F4] pb-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-black/5 ${config.bg} ${config.color} flex items-center gap-2`}>
                {config.icon}
                {project.status}
              </span>
              <span className="text-xs font-semibold text-[#9E9E9E] bg-[#F5F5F4] px-3 py-1 rounded-lg">ID: SOLAR-{project.id.toString().padStart(4, '0')}</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tighter group-hover:text-black transition-colors">{project.name}</h2>
            <p className="text-lg text-[#616161] leading-relaxed max-w-3xl">{project.description || 'Tracking your transition to renewable energy.'}</p>
          </div>
          
          <div className="text-right shrink-0 hidden md:block">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E] mb-1">Expected Subsidy</p>
            <p className="text-3xl font-bold tracking-tight text-emerald-600">Calculated</p>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="py-6 overflow-x-auto scrollbar-hide">
          <div className="relative min-w-[800px] px-4">
            {/* Background Line */}
            <div className="absolute top-5 left-4 right-4 h-1 bg-[#F5F5F4] rounded-full" />
            
            {/* Active Line Progress */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `calc(${(SOLAR_STAGES.indexOf(project.status) / (SOLAR_STAGES.length - 1)) * 100}% - 32px)` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="absolute top-5 left-4 h-1 bg-emerald-500 rounded-full z-10"
            />

            {/* Stages */}
            <div className="relative flex justify-between z-20">
              {SOLAR_STAGES.map((stage, sIdx) => {
                const currentIdx = SOLAR_STAGES.indexOf(project.status);
                const isReached = sIdx <= currentIdx;
                const isCurrent = sIdx === currentIdx;

                return (
                  <div key={stage} className="flex flex-col items-center gap-4">
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: isCurrent ? 1.2 : 1,
                        backgroundColor: isReached ? '#10b981' : '#f5f5f4', // emerald-500 or neutral-100
                      }}
                      className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors border-4 border-white"
                    >
                      {isReached ? (
                        <CheckCircle2 size={18} className="text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />
                      )}
                    </motion.div>
                    <div className="text-center">
                      <p className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${isReached ? 'text-black' : 'text-[#9E9E9E]'}`}>
                        {stage}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Details */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-[#F5F5F4]">
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E]">Customer Verified</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users size={16} /> Yes
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E]">Last Milestone</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={16} /> {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">Overall Progress</p>
                <div className="text-2xl font-bold font-mono">{project.progress}%</div>
             </div>
             <div className="w-32 h-2 bg-[#F5F5F4] rounded-full overflow-hidden border border-[#E5E5E5]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  className="h-full bg-black" 
                />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
