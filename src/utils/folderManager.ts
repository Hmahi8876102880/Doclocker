import { DocumentType, FamilyMember, IndianDocument, MemoryFolder } from '../types';

/**
 * Standard auto-created category memory folders in encrypted state
 */
export const DEFAULT_CATEGORY_FOLDERS: Omit<MemoryFolder, 'createdAt'>[] = [
  {
    id: 'folder_cat_aadhaar',
    name: 'Aadhaar & National UID',
    description: 'Unique Identification Authority of India (UIDAI) documents',
    type: 'category',
    categoryKey: 'aadhaar',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
    iconName: 'Shield',
  },
  {
    id: 'folder_cat_pan',
    name: 'PAN & Tax Records',
    description: 'Income Tax Department permanent account number records',
    type: 'category',
    categoryKey: 'pan',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300',
    iconName: 'CreditCard',
  },
  {
    id: 'folder_cat_driving',
    name: 'Driving & Transport',
    description: 'Ministry of Road Transport & Highways and RTO licenses',
    type: 'category',
    categoryKey: 'driving_license',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
    iconName: 'Car',
  },
  {
    id: 'folder_cat_voter',
    name: 'Election & Voter ID',
    description: 'Election Commission of India (ECI) EPIC voter credentials',
    type: 'category',
    categoryKey: 'voter_id',
    color: 'from-purple-500/20 to-violet-500/10 border-purple-500/40 text-purple-300',
    iconName: 'Vote',
  },
  {
    id: 'folder_cat_passport',
    name: 'Passports & Travel',
    description: 'Ministry of External Affairs official passport booklets',
    type: 'category',
    categoryKey: 'passport',
    color: 'from-amber-400/20 to-yellow-500/10 border-amber-400/40 text-amber-200',
    iconName: 'BookOpen',
  },
  {
    id: 'folder_cat_other',
    name: 'Civil, Health & Other IDs',
    description: 'Ayushman Bharat, Ration cards, Certificates & welfare IDs',
    type: 'category',
    categoryKey: 'other',
    color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/40 text-cyan-300',
    iconName: 'FileText',
  },
];

/**
 * Get or automatically create the in-memory folder for a specific document type
 */
export function getAutoFolderForDocType(docType: DocumentType): MemoryFolder {
  const match = DEFAULT_CATEGORY_FOLDERS.find((f) => f.categoryKey === docType);
  if (match) {
    return {
      ...match,
      createdAt: 1700000000000,
    };
  }
  return {
    id: `folder_cat_${docType}`,
    name: `${docType.toUpperCase()} Documents`,
    description: 'Auto-created memory folder',
    type: 'category',
    categoryKey: docType,
    color: 'from-slate-700/40 to-slate-800/40 border-slate-700 text-slate-200',
    iconName: 'Folder',
    createdAt: Date.now(),
  };
}

/**
 * Automatically builds all active memory folders (both Category and Member folders)
 * populated with their documents stored in memory
 */
export function getAutoCreatedMemoryFolders(
  documents: IndianDocument[],
  members: FamilyMember[],
  groupBy: 'category' | 'member' = 'category'
): { folder: MemoryFolder; documents: IndianDocument[] }[] {
  if (groupBy === 'category') {
    return DEFAULT_CATEGORY_FOLDERS.map((catDef) => {
      const folder: MemoryFolder = {
        ...catDef,
        createdAt: 1700000000000,
      };
      const docsInFolder = documents.filter((d) => d.type === catDef.categoryKey);
      return {
        folder,
        documents: docsInFolder,
      };
    });
  }

  // Group by Family Member Profile Folder
  return members.map((member) => {
    const folder: MemoryFolder = {
      id: `folder_member_${member.id}`,
      name: `${member.name} (${member.isPrimary ? 'Self' : member.relationship})`,
      description: `Auto-created memory folder for ${member.name}`,
      type: 'member',
      memberId: member.id,
      color: member.isPrimary
        ? 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300'
        : 'from-indigo-500/20 to-blue-500/10 border-indigo-500/40 text-indigo-300',
      iconName: 'User',
      createdAt: member.createdAt || Date.now(),
    };
    const docsInFolder = documents.filter((d) => d.memberId === member.id);
    return {
      folder,
      documents: docsInFolder,
    };
  });
}
