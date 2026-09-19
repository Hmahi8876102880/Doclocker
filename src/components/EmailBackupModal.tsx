import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail } from 'lucide-react';
import { FamilyMember, IndianDocument, SecuritySettings } from '../types';
import { EmailBackupSection } from './EmailBackupSection';

interface EmailBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryMember: FamilyMember;
  members: FamilyMember[];
  documents: IndianDocument[];
  securitySettings: SecuritySettings;
  onRestoreVault?: (
    restoredMembers: FamilyMember[],
    restoredDocs: IndianDocument[],
    restoredSecurity?: SecuritySettings
  ) => void;
}

export const EmailBackupModal: React.FC<EmailBackupModalProps> = ({
  isOpen,
  onClose,
  primaryMember,
  members,
  documents,
  securitySettings,
  onRestoreVault,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-8 text-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ইমেইল বেকআপ আৰু ৰিষ্ট'ৰ</h3>
                  <p className="text-[10px] text-slate-400">Email Vault Backup & Restore</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              <EmailBackupSection
                primaryMember={primaryMember}
                members={members}
                documents={documents}
                securitySettings={securitySettings}
                onRestoreVault={onRestoreVault}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
