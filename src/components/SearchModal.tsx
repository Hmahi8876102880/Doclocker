import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  FileText,
  ArrowRight,
  User,
  Users,
  ScanLine,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import { IndianDocument, FamilyMember, DocumentType } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: IndianDocument[];
  members: FamilyMember[];
  onOpenDocument: (doc: IndianDocument) => void;
  onOpenUpload: () => void;
  onSelectMember?: (memberId: string) => void;
  onEditMember?: (memberId: string) => void;
}

type FilterCategory = 'all' | 'members' | DocumentType;

const CATEGORY_CHIPS: { label: string; key: FilterCategory }[] = [
  { label: 'All', key: 'all' },
  { label: 'Members', key: 'members' },
  { label: 'Aadhaar', key: 'aadhaar' },
  { label: 'PAN', key: 'pan' },
  { label: 'Voter ID', key: 'voter_id' },
  { label: 'Driving License', key: 'driving_license' },
  { label: 'Passport', key: 'passport' },
  { label: 'Other', key: 'other' },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  documents,
  members,
  onOpenDocument,
  onOpenUpload,
  onSelectMember,
  onEditMember,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<FilterCategory>('all');

  // Filter Family Members
  const filteredMembers = useMemo(() => {
    if (selectedType !== 'all' && selectedType !== 'members') {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return members;
    }
    return members.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const rel = (m.relationship || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || rel.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [members, query, selectedType]);

  // Filter Documents
  const filteredDocs = useMemo(() => {
    if (selectedType === 'members') {
      return [];
    }
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      // Category filter
      if (selectedType !== 'all' && doc.type !== selectedType) {
        return false;
      }

      // Query filter
      if (!q) return true;

      const member = members.find((m) => m.id === doc.memberId);
      const memberName = member?.name?.toLowerCase() || '';
      const docTitle = doc.title?.toLowerCase() || '';
      const docNum = doc.docNumber?.toLowerCase() || '';
      const maskedNum = doc.maskedNumber?.toLowerCase() || '';
      const nameOnDoc = doc.nameOnDoc?.toLowerCase() || '';
      const fatherName = doc.fatherName?.toLowerCase() || '';
      const issuer = doc.issuerOrg?.toLowerCase() || '';
      const relationship = doc.relationship?.toLowerCase() || '';

      return (
        docTitle.includes(q) ||
        docNum.includes(q) ||
        maskedNum.includes(q) ||
        nameOnDoc.includes(q) ||
        memberName.includes(q) ||
        fatherName.includes(q) ||
        issuer.includes(q) ||
        relationship.includes(q)
      );
    });
  }, [documents, members, query, selectedType]);

  const totalResults = filteredMembers.length + filteredDocs.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-12 sm:pt-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl z-10 text-slate-100 max-h-[85vh] flex flex-col"
        >
          {/* Top Search Input Bar */}
          <div className="relative flex items-center mb-3">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search member name, document title, card number..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Filter Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {CATEGORY_CHIPS.map((chip, idx) => {
              const isSelected = selectedType === chip.key;
              return (
                <button
                  key={`search-chip-${chip.key}-${idx}`}
                  onClick={() => setSelectedType(chip.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {chip.label}
                  {chip.key === 'members' && (
                    <span className="ml-1 text-[10px] opacity-80 font-mono">({members.length})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[160px]">
            {/* 1. FAMILY MEMBERS SEARCH RESULTS */}
            {filteredMembers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    <span>Family Members ({filteredMembers.length})</span>
                  </div>
                  {query && (
                    <span className="text-[10px] text-slate-400">
                      Matches name or relation
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {filteredMembers.map((member, idx) => {
                    const memberDocs = documents.filter((d) => d.memberId === member.id);
                    return (
                      <div
                        key={`search-member-${member.id || 'mem'}-${idx}`}
                        className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all flex items-center justify-between gap-3 group"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectMember?.(member.id);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div
                            className={`w-11 h-11 rounded-full ${
                              member.avatarBg || 'bg-indigo-600'
                            } border-2 border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm`}
                          >
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span>{(member.name || 'M').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white group-hover:text-amber-300 truncate">
                                {member.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  member.isPrimary
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {member.isPrimary ? 'Self' : member.relationship}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-amber-400/90 font-medium">
                                {memberDocs.length} {memberDocs.length === 1 ? 'Document' : 'Documents'}
                              </span>
                              {member.phone && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-400">{member.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onEditMember && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditMember(member.id);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                              title="Edit Member Profile"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectMember?.(member.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>View Docs</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. DOCUMENTS SEARCH RESULTS */}
            {filteredDocs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Documents & Cards ({filteredDocs.length})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredDocs.map((doc, idx) => {
                    const member = members.find((m) => m.id === doc.memberId);
                    return (
                      <button
                        key={`search-doc-${doc.id || 'doc'}-${idx}`}
                        onClick={() => {
                          onClose();
                          onOpenDocument(doc);
                        }}
                        className="w-full p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white truncate group-hover:text-amber-300">
                                {doc.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                Encrypted
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono text-slate-300">{doc.maskedNumber}</span>
                              <span>•</span>
                              <span className="truncate text-slate-400">
                                {member?.name || doc.nameOnDoc || 'Personal'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 group-hover:text-amber-400 shrink-0">
                          <span className="text-xs font-medium hidden sm:inline">View</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NO RESULTS STATE */}
            {totalResults === 0 && (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">
                    No results found {query ? `for "${query}"` : ''}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching by member name, relation, or scan a new Indian identity document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scan New Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>AES-256 On-Device Search</span>
            <span>
              {totalResults} matching result{totalResults !== 1 ? 's' : ''} ({filteredMembers.length} members, {filteredDocs.length} docs)
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

