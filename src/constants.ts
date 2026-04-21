import { SolarStage } from './types';

export const STAGE_PROGRESS: Record<SolarStage, number> = {
  'Site Visit': 10,
  'Proposal': 20,
  'eKYC': 30,
  'Payment': 40,
  'Approvals': 50,
  'Material': 60,
  'Installation': 80,
  'Net Meter': 90,
  'Subsidy': 100,
};

export const SOLAR_STAGES: SolarStage[] = [
  'Site Visit',
  'Proposal',
  'eKYC',
  'Payment',
  'Approvals',
  'Material',
  'Installation',
  'Net Meter',
  'Subsidy'
];
