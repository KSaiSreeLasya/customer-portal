export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export type SolarStage = 'Site Visit' | 'Proposal' | 'eKYC' | 'Payment' | 'Approvals' | 'Material' | 'Installation' | 'Net Meter' | 'Subsidy';

export interface Project {
  id: string;
  name: string;
  description: string;
  email?: string;
  status: SolarStage;
  progress: number;
  assigned_customers?: string;
  customer_name?: string;
  contact_no?: string;
  payment_mode?: string;
  proposal_amount?: number;
  paid_amount?: number;
  advance_amount?: number;
  advance_payment?: number;
  advance_amt?: number;
  balance_amount?: number;
  created_at: string;
  updated_at: string;
}
