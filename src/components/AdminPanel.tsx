import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, FolderKanban, CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, Search, Filter } from 'lucide-react';
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
      // Fetch customers from local API (still managed locally for auth)
      try {
        const customersRes = await fetch('/api/users', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        const contentType = customersRes.headers.get('content-type');
        if (customersRes.ok && contentType && contentType.includes('application/json')) {
          const customersData = await customersRes.json();
          setCustomers(customersData);
        } else {
          console.warn('Customer fetch skipped: API returned non-JSON or error status', customersRes.status);
        }
      } catch (custErr) {
        console.error('Customer fetch network error:', custErr);
      }

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
      const progress = STAGE_PROGRESS[status as keyof typeof STAGE_PROGRESS] || 0;
      
      // Update locally immediately for best DX
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: status as any, progress } : p));
      if (selectedProject?.id === id) {
        setSelectedProject(prev => prev ? { ...prev, status: status as any, progress, updated_at: new Date().toISOString() } : null);
      }

      const { error: sbError } = await supabase
        .from('projects')
        .update({ status, progress, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (sbError) throw sbError;
      
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
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-2">
            {activeTab === 'Overview' ? 'Admin Control' : activeTab}
          </h1>
          <p className="text-[#616161] font-medium">
            {activeTab === 'Overview' && 'Manage your fleet of 220+ customers and projects.'}
            {activeTab === 'Customers' && 'View and manage your registered customers.'}
            {activeTab === 'Installations' && 'Track and update specialized solar installations.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowAddCustomer(true)}
            className="px-6 py-3 bg-white border border-[#E5E5E5] rounded-xl font-semibold text-sm hover:bg-[#F5F5F4] transition-all flex items-center gap-2"
          >
            <Users size={18} /> Add Customer
          </button>
          <button 
            onClick={() => setShowAddProject(true)}
            className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-black/10"
          >
            <Plus size={18} /> New Project
          </button>
        </div>
      </header>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Installations" value={projects.length} icon={<FolderKanban />} />
          <StatCard label="Active Customers" value={customers.length} icon={<Users />} />
          <StatCard label="Completed Subsidy" value={projects.filter(p => p.status === 'Subsidy').length} icon={<CheckCircle2 />} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium">
          Error: {error}.
        </div>
      )}

      {(activeTab === 'Overview' || activeTab === 'Installations') && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-[#E5E5E5]">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
              <input
                type="text"
                placeholder="Search projects by name or customer..."
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

          {/* Projects Table */}
          <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
            <div className="p-6 border-b border-[#E5E5E5] flex justify-between items-center">
              <h2 className="font-bold text-xl tracking-tight">Active Projects</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">Showing {filteredProjects.length} of {projects.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F5F4] text-[#9E9E9E] font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F5F5F4]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedProject(p)}
                          className="font-semibold text-sm text-[#1A1A1A] hover:underline decoration-2 underline-offset-4 text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#616161]">
                        {p.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#616161]">
                        {p.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right w-48">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs font-bold font-mono">{p.progress}%</span>
                          <div className="w-24 h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1A1A1A]" style={{ width: `${p.progress}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-[#9E9E9E] font-medium">
                        No projects found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="bg-white rounded-[40px] p-10 max-w-4xl w-full my-auto shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-8 right-8 text-[#9E9E9E] hover:text-black transition-colors"
            >
              <Plus className="rotate-45" size={32} />
            </button>

            <div className="space-y-10">
              {/* Header */}
              <div className="space-y-4 border-b border-[#F5F5F4] pb-8">
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedProject.status} />
                  <span className="text-xs font-semibold text-[#9E9E9E] bg-[#F5F5F4] px-3 py-1 rounded-lg">ID: SOLAR-{selectedProject.id}</span>
                </div>
                <h2 className="text-5xl font-bold tracking-tighter">{selectedProject.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-1">Customer</p>
                    <p className="font-semibold">{selectedProject.customer_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-1">Phone</p>
                    <p className="font-semibold">{selectedProject.phone || 'Not specified'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-[#1A1A1A] p-6 rounded-[24px] text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Proposal</p>
                    <p className="text-lg font-bold">₹{(selectedProject.proposal_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Advance</p>
                    <p className="text-lg font-bold">₹{(selectedProject.advance_amount || selectedProject.advance_payment || selectedProject.advance_amt || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Paid</p>
                    <p className="text-lg font-bold">₹{(selectedProject.paid_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Balance</p>
                    <p className="text-lg font-bold text-rose-400">₹{((selectedProject.proposal_amount || 0) - (selectedProject.advance_payment || selectedProject.advance_amount || selectedProject.advance_amt || 0) - (selectedProject.paid_amount || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">Project Description</h3>
                <p className="text-xl text-[#424242] leading-relaxed">
                  {selectedProject.description || 'No detailed description available for this project.'}
                </p>
              </div>

              {/* Progress Section */}
              <div className="space-y-6 bg-[#F5F5F4] p-8 rounded-[32px]">
                <div className="flex justify-between items-center px-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">Workflow Status</h3>
                    <div className="flex items-center gap-4">
                      <p className="text-3xl font-bold tracking-tight">{selectedProject.status}</p>
                      <select 
                        value={selectedProject.status}
                        onChange={(e) => updateProjectStatus(selectedProject.id, e.target.value)}
                        className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-black outline-none cursor-pointer"
                      >
                        {SOLAR_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E] mb-1">Overall Completion</p>
                    <p className="text-5xl font-black tracking-tighter font-mono">{selectedProject.progress}%</p>
                  </div>
                </div>
                
                <div key={`${selectedProject.id}-${selectedProject.status}`}>
                  <StatusPipeline currentStatus={selectedProject.status} />
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E]">Registered On</p>
                  <p className="font-semibold flex items-center gap-2"><Clock size={16} /> {new Date(selectedProject.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E]">Last Updated</p>
                  <p className="font-semibold flex items-center gap-2"><ArrowUpRight size={16} /> {new Date(selectedProject.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E]">System Tags</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded">SOLAR</span>
                    <span className="text-[10px] font-bold bg-[#E5E5E5] px-2 py-0.5 rounded">RENEWABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] flex justify-between items-start">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E]">{label}</p>
        <p className="text-5xl font-bold tracking-tighter">{value}</p>
      </div>
      <div className="w-12 h-12 bg-[#F5F5F4] rounded-2xl flex items-center justify-center text-[#1A1A1A]">
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Site Visit': 'bg-neutral-50 text-neutral-600 border-neutral-100',
    'Proposal': 'bg-blue-50 text-blue-600 border-blue-100',
    'eKYC': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Payment': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Approvals': 'bg-amber-50 text-amber-600 border-amber-100',
    'Material': 'bg-orange-50 text-orange-600 border-orange-100',
    'Installation': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Net Meter': 'bg-purple-50 text-purple-600 border-purple-100',
    'Subsidy': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const style = styles[status] || 'bg-neutral-50 text-neutral-600 border-neutral-100';

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
      {status}
    </span>
  );
}
