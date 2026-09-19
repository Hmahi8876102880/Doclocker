import { UnofficialDocument } from '../types';

export const INITIAL_DRIVE_DOCUMENTS: UnofficialDocument[] = [
  {
    id: 'drive_doc_academic_1',
    memberId: 'mem_primary',
    title: 'HSLC / Matriculation Certificate',
    category: 'academic',
    date: '2016-06-15',
    notes: 'Board of Secondary Education, Assam (SEBA) HSLC Pass Certificate & Marksheet',
    photoUrl:
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    tags: ['Certificate', 'HSLC', 'Education', 'SEBA'],
    fileSize: '1.4 MB',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'drive_doc_medical_1',
    memberId: 'mem_primary',
    title: 'Medical Prescription & Lab Report',
    category: 'medical',
    date: '2026-08-10',
    notes: 'Health Checkup, Routine Blood Test & Doctor Consultation prescription',
    photoUrl:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    tags: ['Prescription', 'Medical', 'Clinic', 'Doctor'],
    fileSize: '950 KB',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'drive_doc_bill_1',
    memberId: 'mem_primary',
    title: 'APDCL Electricity Bill & Payment Receipt',
    category: 'bill_receipt',
    date: '2026-09-02',
    notes: 'Assam Power Distribution Company Ltd - Paid Online Consumer Receipt',
    photoUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    tags: ['APDCL', 'Electricity Bill', 'Payment Receipt'],
    fileSize: '820 KB',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
];
