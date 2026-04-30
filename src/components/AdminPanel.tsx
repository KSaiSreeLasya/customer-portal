import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, FolderKanban, CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, Search, Filter, ArrowLeft } from 'lucide-react';
import { User, Project } from '../types';
import { SOLAR_STAGES, STAGE_PROGRESS } from '../constants';
import { supabase } from '../lib/supabase';
import { StatusPipeline } from './StatusPipeline';

export default function AdminPanel({ activeTab }: { activeTab: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPass, setCustomerPass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      // Fetch customers
      // We try to fetch from local API, but if it fails (common in serverless deploys),
      // we can optionally derive unique customers from our Supabase projects list
      let customersList: User[] = [];
      try {
        const customersRes = await fetch('/api/users', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        const contentType = customersRes.headers.get('content-type');
        if (customersRes.ok && contentType && contentType.includes('application/json')) {
          customersList = await customersRes.json();
        }
      } catch (custErr) {
        console.warn('Customer fetch via API failed, will check Supabase table next');
      }

      // Try fetching customers from Supabase if API failed or returned nothing
      if (customersList.length === 0) {
        try {
          const { data: sbCustomers } = await supabase.from('customers').select('*');
          if (sbCustomers) customersList = sbCustomers as any;
        } catch (e) {
          console.warn('Supabase customers table not found. Using project references as fallback.');
        }
      }

      setCustomers(customersList);

      // Fetch projects from Supabase
      const { data: projectsData, error: sbError } = await supabase
        .from('projects')
        .select('*');
      
      if (sbError) throw sbError;
      setProjects(projectsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const initialStatus = 'Site Visit';
      const progress = STAGE_PROGRESS[initialStatus];

      const { data, error: sbError } = await supabase
        .from('projects')
        .insert([{ 
          name: projectName, 
          description: projectDesc, 
          customer_name: customerNameInput,
          phone: phoneInput,
          proposal_amount: proposalAmount ? parseFloat(proposalAmount) : 0,
          paid_amount: paidAmount ? parseFloat(paidAmount) : 0,
          advance_amount: advanceAmount ? parseFloat(advanceAmount) : 0,
          balance_amount: (proposalAmount ? parseFloat(proposalAmount) : 0) - (advanceAmount ? parseFloat(advanceAmount) : 0) - (paidAmount ? parseFloat(paidAmount) : 0),
          status: initialStatus,
          progress: progress
        }])
        .select();

      if (sbError) throw sbError;

      setShowAddProject(false);
      setProjectName('');
      setProjectDesc('');
      setCustomerNameInput('');
      setPhoneInput('');
      setProposalAmount('');
      setPaidAmount('');
      setAdvanceAmount('');
      setSelectedCustomers([]);
      fetchData();
    } catch (err) {
      console.error('Add project error:', err);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    // Keep local for auth simplicity
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: customerName, email: customerEmail, password: customerPass })
    });
    setShowAddCustomer(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPass('');
    fetchData();
  };

  const updateProjectStatus = async (id: string, status: string) => {
    try {
      const oldProject = projects.find(p => p.id === id);
      const progress = STAGE_PROGRESS[status as keyof typeof STAGE_PROGRESS] || 0;
      
      // Update locally immediately for best DX
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: status as any, progress } : p));
      if (selectedProject?.id === id) {
        setSelectedProject(prev => prev ? { ...prev, status: status as any, progress, updated_at: new Date().toISOString() } : null);
      }

      // 1. Update Project Status
      const { error: sbError } = await supabase
        .from('projects')
        .update({ status, progress, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (sbError) throw sbError;

      // 2. Log the change
      await supabase.from('status_logs').insert([{
        project_id: id,
        old_status: oldProject?.status,
        new_status: status,
        updated_by: 'Admin'
      }]);
      
      // Still fetch to sync with DB
      fetchData();
    } catch (err: any) {
      console.error('Update status error:', err);
      setError(err.message);
      // Revert on error
      fetchData();
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.customer_name && p.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.phone && p.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.assigned_customers && p.assigned_customers.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 pb-8 border-b border-line-muted">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9E9E9E]">Operations Control</p>
          </div>
          <h1 className="text-6xl font-display font-bold tracking-tighter leading-none mb-4">
            {activeTab === 'Overview' ? 'System Overview' : activeTab}
          </h1>
          <p className="text-[#616161] font-medium max-w-xl">
            {activeTab === 'Overview' && 'Comprehensive tracking of residential solar deployments and multi-stage subsidy orchestrations.'}
            {activeTab === 'Customers' && 'Identity management and directory services for the solar infrastructure network.'}
            {activeTab === 'Installations' && 'Precision logging for localized specialized solar installation pipelines.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowAddCustomer(true)}
            className="px-6 py-4 bg-white border border-line-muted rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-surface-bg transition-all flex items-center gap-2 active:scale-95"
          >
            <Users size={16} className="text-[#9E9E9E]" /> Provision User
          </button>
          <button 
            onClick={() => setShowAddProject(true)}
            className="px-6 py-4 bg-brand-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95"
          >
            <Plus size={16} className="text-brand-accent" /> Initialize Project
          </button>
        </div>
      </header>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Network Reach" value={projects.length} subtext="Active Nodes" icon={<FolderKanban />} />
          <StatCard label="Identity Count" value={customers.length} subtext="Registered Entities" icon={<Users />} />
          <StatCard label="Finalized Pipeline" value={projects.filter(p => p.status === 'Subsidy').length} subtext="Subsidy Resolved" icon={<CheckCircle2 />} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium">
          Error: {error}.
        </div>
      )}

      {(activeTab === 'Overview' || activeTab === 'Installations') && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-[24px] border border-line-muted shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary/20" size={20} />
              <input
                type="text"
                placeholder="Search index by project ID, customer name, or contact..."
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
                <option value="All">All Operations</option>
                {SOLAR_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-[32px] border border-line-muted shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-line-muted flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(255,212,59,0.5)]" />
                <h2 className="font-display font-bold text-2xl tracking-tight text-brand-primary">Project Register</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Total Logs</span>
                <span className="text-sm font-mono font-black text-brand-primary bg-surface-bg px-3 py-1 rounded-lg border border-line-muted">
                  {filteredProjects.length.toString().padStart(3, '0')} / {projects.length.toString().padStart(3, '0')}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bg/50 border-b border-line-muted">
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Designation</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Assigned Lead</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Contact Vector</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Pipeline Status</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-muted">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-bg transition-colors group cursor-default">
                      <td className="px-10 py-6">
                        <button 
                          onClick={() => setSelectedProject(p)}
                          className="flex flex-col items-start gap-1 group/btn"
                        >
                          <span className="font-bold text-sm text-brand-primary group-hover/btn:text-black transition-colors">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#9E9E9E] uppercase tracking-tighter">REF-SOLAR-{p.id.toString().slice(0, 8)}</span>
                        </button>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-primary text-brand-accent text-[10px] font-bold flex items-center justify-center">
                            {(p.customer_name || 'U').charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-brand-primary opacity-80 italic serif">{p.customer_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-mono text-xs font-bold text-[#616161]">
                        {p.phone || '-- -- --'}
                      </td>
                      <td className="px-10 py-6">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <div className="text-right">
                            <span className="block text-xs font-mono font-black text-brand-primary">{p.progress}%</span>
                            <span className="block text-[8px] font-bold uppercase tracking-widest text-[#9E9E9E]">Integrated</span>
                          </div>
                          <div className="w-24 h-1.5 bg-surface-bg rounded-full overflow-hidden border border-line-muted">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p.progress}%` }}
                              className="h-full bg-brand-primary" 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-surface-bg rounded-3xl flex items-center justify-center text-brand-primary/10">
                            <FolderKanban size={32} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-primary">Null Result Cluster</p>
                            <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest mt-1">No matches found for active query</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Customers' && (
        <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
          <div className="p-6 border-b border-[#E5E5E5] flex justify-between items-center">
            <h2 className="font-bold text-xl tracking-tight">Customer Directory</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">Total: {customers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F5F5F4] text-[#9E9E9E] font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Identifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F5F4]/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-sm">{c.name}</td>
                    <td className="px-6 py-4 text-[#616161] text-sm">{c.email}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold font-mono bg-[#F5F5F4] px-2 py-1 rounded">USR-{c.id.toString().padStart(4, '0')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals (simplified for speed, usually separate components) */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-lg w-full">
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Create New Project</h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <input 
                placeholder="Project Name" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                value={projectName} onChange={e => setProjectName(e.target.value)} required
              />
              <textarea 
                placeholder="Description" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none h-32"
                value={projectDesc} onChange={e => setProjectDesc(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Customer Name" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                  value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} required
                />
                <input 
                  placeholder="Phone" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                  value={phoneInput} onChange={e => setPhoneInput(e.target.value)} required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" placeholder="Proposal Amount" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                  value={proposalAmount} onChange={e => setProposalAmount(e.target.value)}
                />
                <input 
                  type="number" placeholder="Paid Amount" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                  value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" placeholder="Advance Amount" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                  value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddProject(false)} className="flex-1 py-4 font-semibold text-[#9E9E9E]">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-semibold shadow-lg shadow-black/10">Create Project</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Add Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input 
                placeholder="Name" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                value={customerName} onChange={e => setCustomerName(e.target.value)} required
              />
              <input 
                type="email" placeholder="Email" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required
              />
              <input 
                type="password" placeholder="Password" className="w-full p-4 bg-[#F5F5F4] rounded-xl border-none"
                value={customerPass} onChange={e => setCustomerPass(e.target.value)} required
              />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 py-4 font-semibold text-[#9E9E9E]">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-semibold shadow-lg shadow-black/10">Add User</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-brand-primary/95 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="bg-white rounded-[40px] p-12 max-w-5xl w-full my-auto shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] hover:text-brand-primary transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-bg flex items-center justify-center group-hover:bg-brand-accent transition-colors">
                  <ArrowLeft size={16} />
                </div>
                Back to Index
              </button>
              
              <button 
                onClick={() => setSelectedProject(null)}
                className="w-12 h-12 rounded-full bg-surface-bg flex items-center justify-center text-brand-primary hover:bg-brand-accent transition-all duration-300"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Core Info */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selectedProject.status} />
                    <span className="text-[10px] font-black font-mono text-[#9E9E9E] bg-surface-bg px-3 py-1 rounded-lg border border-line-muted">SYSTEM_ID: SOL-{selectedProject.id.toString().slice(0, 8)}</span>
                  </div>
                  <h2 className="text-6xl font-display font-bold tracking-tighter leading-[0.9]">{selectedProject.name}</h2>
                  <div className="flex gap-10 pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-2">Primary Stakeholder</p>
                      <p className="font-bold text-lg italic serif">{selectedProject.customer_name || 'Unassigned Node'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-2">Secure Line</p>
                      <p className="font-mono font-bold text-lg">{selectedProject.phone || 'NO_VECTOR'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] px-1">Project Manifest</h3>
                  <div className="p-6 bg-surface-bg rounded-[24px] border border-line-muted">
                    <p className="text-lg text-[#424242] leading-relaxed font-medium">
                      {selectedProject.description || 'System generated: No additional manifest provided for this project ID.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">Financial Ledger</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <FinanceItem label="QUOTED" value={selectedProject.proposal_amount} />
                    <FinanceItem label="RETAINER" value={selectedProject.advance_payment || selectedProject.advance_amount || selectedProject.advance_amt} />
                    <FinanceItem label="SETTLED" value={selectedProject.paid_amount} />
                    <FinanceItem label="OUTSTANDING" value={(selectedProject.proposal_amount || 0) - (selectedProject.advance_payment || selectedProject.advance_amount || selectedProject.advance_amt || 0) - (selectedProject.paid_amount || 0)} highlight />
                  </div>
                </div>
              </div>

              {/* Right Column: Pipeline & Actions */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-brand-primary p-8 rounded-[32px] text-white space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Pipeline Phase</p>
                      <div className="flex flex-col gap-2">
                        <span className="text-3xl font-display font-bold tracking-tight">{selectedProject.status}</span>
                        <div className="inline-flex">
                          <select 
                            value={selectedProject.status}
                            onChange={(e) => updateProjectStatus(selectedProject.id, e.target.value)}
                            className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors"
                          >
                            {SOLAR_STAGES.map(stage => (
                              <option key={stage} value={stage} className="bg-brand-primary text-white">{stage}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Sync Status</p>
                      <p className="text-5xl font-display font-black tracking-tighter text-brand-accent">{selectedProject.progress}%</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Visual Sequence</p>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedProject.progress}%` }}
                        className="h-full bg-brand-accent shadow-[0_0_15px_rgba(255,212,59,0.5)]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Metric label="Latency" value="12ms" />
                       <Metric label="Integrity" value="99.9%" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] px-1">Infrastructure Timeline</h3>
                   <ProjectHistory project={selectedProject} />
                </div>

                <div className="p-6 border border-line-muted rounded-3xl bg-surface-bg flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Auto-Reporting Active</span>
                   </div>
                   <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline">Download Log</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProjectHistory({ project }: { project: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('status_logs')
        .select('*')
        .eq('project_id', project.id)
        .order('updated_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [project.id, project.status]);

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-brand-primary/20" size={20} /></div>;

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {logs.length === 0 ? (
        <div className="p-4 bg-surface-bg rounded-2xl border border-line-muted text-center italic text-[#9E9E9E] text-[10px] font-bold uppercase tracking-widest">
          No records captured for this node.
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-line-muted shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-bg flex items-center justify-center text-[#9E9E9E] group-hover:bg-brand-accent transition-colors">
                <ArrowUpRight size={14}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary leading-none mb-1">
                  {log.new_status}
                </p>
                <p className="text-[8px] font-bold text-[#9E9E9E] uppercase tracking-tighter">
                  Prev: {log.old_status || 'INIT'}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#616161]">
              {new Date(log.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))
      )}
      <TimelineItem label="Initialization" date={project.created_at} icon={<Clock size={14}/>} />
    </div>
  );
}

function FinanceItem({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-rose-50 border-rose-100' : 'bg-white border-line-muted'}`}>
      <p className="text-[8px] font-black uppercase tracking-widest text-[#9E9E9E] mb-1">{label}</p>
      <p className={`text-sm font-mono font-black ${highlight ? 'text-rose-600' : 'text-brand-primary'}`}>₹{(value || 0).toLocaleString()}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string, value: string }) {
  return (
    <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
       <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{label}</span>
       <span className="text-[10px] font-mono font-bold text-white">{value}</span>
    </div>
  );
}

function TimelineItem({ label, date, icon }: { label: string, date: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-line-muted shadow-sm">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-bg flex items-center justify-center text-[#9E9E9E]">
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{label}</span>
       </div>
       <span className="text-[10px] font-mono font-bold text-[#616161]">{new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
    </div>
  );
}

function StatCard({ label, value, subtext, icon }: { label: string, value: number, subtext?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-10 rounded-[32px] border border-line-muted flex justify-between items-start shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
      <div className="space-y-4 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">{label}</p>
        <div>
          <p className="text-6xl font-display font-bold tracking-tighter mb-1">{value}</p>
          {subtext && <p className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">{subtext}</p>}
        </div>
      </div>
      <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-brand-accent shadow-lg shadow-black/10 relative z-10 transition-transform group-hover:-translate-y-1">
        {icon}
      </div>
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
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${style} shadow-sm inline-flex items-center gap-1.5`}>
      <span className={`w-1 h-1 rounded-full ${style.split(' ')[0].replace('text', 'bg')}`} />
      {status}
    </span>
  );
}
