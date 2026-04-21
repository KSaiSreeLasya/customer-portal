export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export type SolarStage = 'Site Visit' | 'Proposal' | 'eKYC' | 'Payment' | 'Approvals' | 'Material' | 'Installation' | 'Net Meter' | 'Subsidy';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: SolarStage;
  progress: number;
  assigned_customers?: string;
  created_at: string;
  updated_at: string;
}
