import { FamilyMember, IndianDocument, SecuritySettings } from '../types';

export const INITIAL_MEMBERS: FamilyMember[] = [
  {
    id: 'mem_primary',
    name: '',
    relationship: 'Self',
    dob: '',
    isPrimary: true,
    phone: '',
    email: '',
    virtualId: '',
    avatarBg: 'bg-emerald-700',
    createdAt: Date.now(),
  },
];

export const INITIAL_DOCUMENTS: IndianDocument[] = [];

export const INITIAL_SECURITY: SecuritySettings = {
  appLockPin: '1234',
  biometricsEnabled: true,
  screenshotProtectionEnabled: true,
  autoLockTimeoutMinutes: 5,
  encryptionAlgorithm: 'AES-256-GCM',
};
