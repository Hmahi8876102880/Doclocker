export type Relationship =
  | 'Self'
  | 'Spouse'
  | 'Child'
  | 'Parent'
  | 'Sibling'
  | 'Father'
  | 'Mother'
  | 'Son'
  | 'Daughter'
  | 'Brother'
  | 'Sister'
  | 'Grandparent'
  | 'Other';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: Relationship;
  dob: string; // YYYY-MM-DD
  avatarUrl?: string;
  avatarBg?: string;
  isPrimary?: boolean;
  phone?: string;
  email?: string;
  virtualId?: string;
  createdAt: number;
}

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'voter_id'
  | 'driving_license'
  | 'passport'
  | 'other';

export interface IndianDocument {
  id: string;
  memberId: string; // references FamilyMember.id
  type: DocumentType;
  title: string;
  docNumber: string; // Unmasked number
  maskedNumber: string; // Display masked number e.g. XXXX-XXXX-1234
  nameOnDoc: string;
  relationship?: Relationship | string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Transgender' | 'Other';
  address?: string;
  fatherName?: string;
  issueDate?: string;
  expiryDate?: string;
  frontImage?: string; // Data URL or SVG illustration
  backImage?: string;
  issuerOrg: string;
  categoryTag: string;
  qrData?: string;
  notes?: string;
  vehicleClasses?: string[]; // For Driving License: MCWG, LMV, etc.
  passportType?: string; // For Passport: P, D, S
  constituency?: string; // For Voter ID
  isVerified: boolean;
  updatedAt: number;
  folderId?: string; // Auto-created memory folder reference
}

export interface MemoryFolder {
  id: string;
  name: string;
  description: string;
  type: 'category' | 'member';
  categoryKey?: DocumentType | string;
  memberId?: string;
  color: string;
  iconName: string;
  createdAt: number;
}

export interface SecuritySettings {
  appLockPin: string; // 4-digit PIN (default '1234')
  biometricsEnabled: boolean;
  screenshotProtectionEnabled: boolean;
  autoLockTimeoutMinutes: number; // 0 = immediate, 1, 5, 15
  encryptionAlgorithm: 'AES-256-GCM';
  lastLockedAt?: number;
}

export interface VaultState {
  members: FamilyMember[];
  documents: IndianDocument[];
  security: SecuritySettings;
  isUnlocked: boolean;
  isAuthenticated: boolean;
  primaryUserPhone: string;
}

export type DriveCategory =
  | 'academic' // Certificates, Marksheets, Diplomas
  | 'medical' // Prescriptions, Lab Reports, Hospital Bills
  | 'bill_receipt' // Bills, Invoices, Receipts, Warranties
  | 'property' // Land deeds, Rent agreements, Electricity receipts
  | 'employment' // Pay slips, Offer letters, Experience letters
  | 'personal' // Personal records, Notes, Photos
  | 'other';

export interface UnofficialDocument {
  id: string;
  memberId: string; // references FamilyMember.id
  title: string;
  category: DriveCategory;
  date?: string;
  notes?: string;
  photoUrl: string; // Data URL or image
  tags?: string[];
  fileSize?: string;
  createdAt: number;
  updatedAt: number;
}
