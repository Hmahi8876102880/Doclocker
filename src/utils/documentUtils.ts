import QRCode from 'qrcode';
import { DocumentType } from '../types';

export function maskDocumentNumber(docNum: string, type: DocumentType): string {
  const clean = docNum.trim();
  if (!clean) return '';

  switch (type) {
    case 'aadhaar': {
      // 12 digits: e.g. 9248 1930 8912 -> XXXX XXXX 8912
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 4) {
        const last4 = digits.slice(-4);
        return `XXXX XXXX ${last4}`;
      }
      return 'XXXX XXXX XXXX';
    }
    case 'pan': {
      // 10 chars: ABCPS9814K -> XXXXX 9814K or XXX-XX-9814K
      const upper = clean.toUpperCase().replace(/\s/g, '');
      if (upper.length >= 5) {
        const last4 = upper.slice(-4);
        return `XXXXX ${last4}`;
      }
      return 'XXXXX XXXX';
    }
    case 'driving_license': {
      // e.g. KA-0320150049211 -> KA-03XXXXXX49211
      if (clean.length > 8) {
        const prefix = clean.slice(0, 5);
        const suffix = clean.slice(-5);
        return `${prefix}XXXXXX${suffix}`;
      }
      return 'DL-XXXXXXXXXXXX';
    }
    case 'voter_id': {
      // e.g. XKJ2849102 -> XKJXXXX102
      if (clean.length >= 6) {
        const prefix = clean.slice(0, 3);
        const suffix = clean.slice(-3);
        return `${prefix}XXXX${suffix}`;
      }
      return 'EPICXXXXXX';
    }
    case 'passport': {
      // e.g. Z3918204 -> Z39XXX04
      if (clean.length >= 6) {
        const prefix = clean.slice(0, 3);
        const suffix = clean.slice(-2);
        return `${prefix}XXX${suffix}`;
      }
      return 'PXXXXXXX';
    }
    default: {
      if (clean.length > 4) {
        return `•••• •••• ${clean.slice(-4)}`;
      }
      return '•••• •••• ••••';
    }
  }
}

export function formatDocInput(value: string, type: DocumentType): string {
  switch (type) {
    case 'aadhaar': {
      const digits = value.replace(/\D/g, '').slice(0, 12);
      const parts = [];
      for (let i = 0; i < digits.length; i += 4) {
        parts.push(digits.slice(i, i + 4));
      }
      return parts.join(' ');
    }
    case 'pan': {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    case 'passport': {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    }
    case 'voter_id': {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    case 'driving_license': {
      return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 18);
    }
    default:
      return value;
  }
}

export async function generateDocQR(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text || 'INDIAN_DOCUMENT_VAULT_VERIFIED', {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch {
    return '';
  }
}

export function getDocumentColorTheme(type: DocumentType) {
  switch (type) {
    case 'aadhaar':
      return {
        bgGradient: 'from-amber-500/10 via-white to-emerald-500/10',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        accent: '#FF9933',
        label: 'Aadhaar (UIDAI)',
        tag: 'UIDAI Verified',
      };
    case 'pan':
      return {
        bgGradient: 'from-sky-500/10 via-slate-50 to-blue-500/10',
        badge: 'bg-sky-100 text-sky-900 border-sky-300',
        accent: '#0284c7',
        label: 'PAN Card (ITD)',
        tag: 'Tax ID',
      };
    case 'driving_license':
      return {
        bgGradient: 'from-emerald-500/10 via-teal-50 to-emerald-500/10',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        accent: '#059669',
        label: 'Driving License',
        tag: 'Transport Dept',
      };
    case 'voter_id':
      return {
        bgGradient: 'from-indigo-500/10 via-purple-50 to-indigo-500/10',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        accent: '#4f46e5',
        label: 'Voter ID (EPIC)',
        tag: 'ECI Registered',
      };
    case 'passport':
      return {
        bgGradient: 'from-slate-800 to-slate-950 text-white',
        badge: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
        accent: '#f59e0b',
        label: 'Republic of India Passport',
        tag: 'MEA India',
      };
    default:
      return {
        bgGradient: 'from-slate-100 to-slate-200',
        badge: 'bg-slate-200 text-slate-800 border-slate-300',
        accent: '#64748b',
        label: 'Document',
        tag: 'Stored',
      };
  }
}
