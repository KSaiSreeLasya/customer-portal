import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, FolderKanban, CheckCircle2, Clock, PlayCircle, Loader2, ArrowUpRight, Search, Filter } from 'lucide-react';
import { User, Project } from '../types';
import { SOLAR_STAGES } from '../constants';

export default function AdminPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPass, setCustomerPass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [projectsRes, customersRes] = await Promise.all([
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!projectsRes.ok || !customersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      setProjects(await projectsRes.json());
      setCustomers(await customersRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: projectName, description: projectDesc, customerIds: selectedCustomers })
    });
    setShowAddProject(false);
    // Reset form
    setProjectName('');
    setProjectDesc('');
    setSelectedCustomers([]);
    fetchData();
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: customerName, email: customerEmail, password: customerPass })
    });
    setShowAddCustomer(false);
    // Reset form
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPass('');
    fetchData();
  };

  const updateProjectStatus = async (id: number, status: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.assigned_customers && p.assigned_customers.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-2">Admin Control</h1>
          <p className="text-[#616161] font-medium">Manage your fleet of 220+ customers and projects.</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Installations" value={projects.length} icon={<FolderKanban />} />
        <StatCard label="Active Customers" value={customers.length} icon={<Users />} />
        <StatCard label="Completed Subsidy" value={projects.filter(p => p.status === 'Subsidy').length} icon={<CheckCircle2 />} />
      </div>

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
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-[#F5F5F4]/50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-sm">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-[#F5F5F4] px-2 py-1 rounded border border-[#E5E5E5]">
                      {p.assigned_customers || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1A1A1A]" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      value={p.status}
                      onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                      className="text-xs font-semibold bg-white border border-[#E5E5E5] rounded p-1"
                    >
                      {SOLAR_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
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
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">Assign Customers</p>
                <div className="max-h-32 overflow-y-auto border border-[#E5E5E5] p-2 rounded-xl">
                  {customers.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm p-1 hover:bg-[#F5F5F4] rounded">
                      <input 
                        type="checkbox" checked={selectedCustomers.includes(c.id)}
                        onChange={e => e.target.checked ? setSelectedCustomers([...selectedCustomers, c.id]) : setSelectedCustomers(selectedCustomers.filter(id => id !== c.id))}
                      />
                      {c.name} ({c.email})
                    </label>
                  ))}
                </div>
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
