import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  FileText,
  UserPlus,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
  CreditCard,
  Building2,
  Car,
  Compass,
  FileCheck,
  Sparkles,
  Award,
  ExternalLink,
  Pencil,
  Edit3,
  Users,
  Search,
} from 'lucide-react';
import { FamilyMember, IndianDocument, DocumentType } from '../types';
import { BottomNavBar } from './BottomNavBar';
import { AddMemberModal } from './AddMemberModal';
import { SearchModal } from './SearchModal';

interface HomeDashboardProps {
  members: FamilyMember[];
  documents: IndianDocument[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  onOpenDocument: (doc: IndianDocument) => void;
  onOpenUpload: (type?: DocumentType, targetMemberId?: string) => void;
  onOpenAddMember?: () => void;
  onAddMember?: (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  onUpdateMember?: (memberId: string, memberData: Partial<FamilyMember>) => void;
  onDeleteMember?: (memberId: string) => void;
  onOpenSettings?: () => void;
  onOpenDrive?: () => void;
  onOpenEmailBackup?: () => void;
  onOpenAllDocuments?: () => void;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
  onOpenSearch?: () => void;
  onHome?: () => void;
  isSettingsOpen?: boolean;
}

// Default standard document cards specified by the wireframe
const DEFAULT_CARD_TYPES: {
  type: DocumentType;
  title: string;
  sub: string;
  authority: string;
  iconType: 'aadhaar' | 'pan' | 'voter' | 'license' | 'passport';
  colorBorder: string;
  badgeColor: string;
}[] = [
  {
    type: 'aadhaar',
    title: 'Aadhaar Card',
    sub: '12-Digit Biometric UID',
    authority: 'UIDAI Govt of India',
    iconType: 'aadhaar',
    colorBorder: 'border-amber-500/40 hover:border-amber-500',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    type: 'pan',
    title: 'PAN Card',
    sub: 'Permanent Account Number',
    authority: 'Income Tax Department',
    iconType: 'pan',
    colorBorder: 'border-sky-500/40 hover:border-sky-500',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    type: 'voter_id',
    title: 'Voter ID (EPIC)',
    sub: 'Elector Photo Identity',
    authority: 'Election Commission of India',
    iconType: 'voter',
    colorBorder: 'border-indigo-500/40 hover:border-indigo-500',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    type: 'driving_license',
    title: 'Driving License',
    sub: 'Smart Card Motor License',
    authority: 'Ministry of Road Transport',
    iconType: 'license',
    colorBorder: 'border-emerald-500/40 hover:border-emerald-500',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    type: 'passport',
    title: 'Passport',
    sub: 'Republic of India Booklet',
    authority: 'Ministry of External Affairs',
    iconType: 'passport',
    colorBorder: 'border-amber-400/40 hover:border-amber-400',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
  },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  members,
  documents,
  selectedMemberId,
  onSelectMember,
  onOpenDocument,
  onOpenUpload,
  onOpenAddMember,
  onAddMember,
  onOpenSettings,
  onOpenDrive,
  onOpenEmailBackup,
  onOpenAllDocuments,
  isSearchOpen,
  onCloseSearch,
  onOpenSearch,
  onHome,
  isSettingsOpen,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberToEditId, setMemberToEditId] = useState<string | null>(null);
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);

  const isSearchModalOpen = isSearchOpen !== undefined ? isSearchOpen : internalSearchOpen;
  const handleCloseSearch = () => {
    if (onCloseSearch) onCloseSearch();
    setInternalSearchOpen(false);
  };
  const handleOpenSearch = () => {
    if (onOpenSearch) onOpenSearch();
    setInternalSearchOpen(true);
  };

  const handleOpenAddMemberModal = (memberId?: string) => {
    setMemberToEditId(memberId || null);
    if (onOpenAddMember) {
      onOpenAddMember();
    }
    setIsAddMemberModalOpen(true);
  };

  const handleHomeClick = () => {
    // 1. Reset profile filter to 'all'
    if (selectedMemberId !== 'all') {
      onSelectMember('all');
    }
    // 2. Close active search modal if open
    handleCloseSearch();
    // 3. Close add member modal if open
    setIsAddMemberModalOpen(false);
    // 4. Smoothly scroll to the top of the dashboard
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 5. Invoke onHome if provided
    if (onHome) onHome();
  };

  const currentActiveTab: 'home' | 'search' | 'scan' | 'member' | 'setting' =
    isSettingsOpen
      ? 'setting'
      : isSearchModalOpen
      ? 'search'
      : isAddMemberModalOpen
      ? 'member'
      : 'home';

  // Filter documents by currently selected member or all
  const filteredDocuments =
    selectedMemberId === 'all'
      ? documents
      : documents.filter((doc) => doc.memberId === selectedMemberId);

  const activeMember = members.find((m) => m.id === selectedMemberId);

  // Map default types to existing stored documents
  const getStoredDocForType = (type: DocumentType) => {
    return filteredDocuments.find((d) => d.type === type);
  };

  // Additional documents stored that aren't the primary 5 default types
  const customDocuments = filteredDocuments.filter(
    (d) => !DEFAULT_CARD_TYPES.some((dt) => dt.type === d.type)
  );

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-4 sm:py-6 pb-32 selection:bg-amber-500 selection:text-white">
      {/* 4. FAMILY PROFILE SELECTOR (Top Row) */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-0.5">
          {/* Clickable Family Profiles Heading + Edit Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddMemberModal()}
              id="btn-family-profiles-heading"
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
              title="Click to edit Family Profiles / Add Member"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                <span>Family Profiles</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/90 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-300 border border-slate-700 group-hover:border-amber-500/40 text-[11px] font-semibold transition-all active:scale-95 shadow-xs">
                <Pencil className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Edit</span>
              </span>
            </button>
          </div>

          {/* Prominent 'All' Search Button: Opens global search for all data across the app */}
          <button
            type="button"
            onClick={() => {
              onSelectMember('all');
              handleOpenSearch();
            }}
            id="btn-all-search-global"
            className="px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-2 active:scale-95 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 hover:from-amber-500/35 hover:to-amber-500/40 text-amber-300 hover:text-amber-200 border border-amber-500/60 hover:border-amber-400 font-extrabold group shadow-md"
            title="Search all documents and data in the app (সকলো ডাটা বিচাৰক)"
            aria-label="Search all app data"
          >
            <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform stroke-[2.5]" />
            <span className="text-sm font-black tracking-wide text-white group-hover:text-amber-200">
              All
            </span>
          </button>
        </div>

        {/* Horizontal Scrollable list of Circular Avatars */}
        <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Members Avatars: Shows all members */}
          {members.map((member, idx) => {
            const isSelected = member.id === selectedMemberId;

            return (
              <div key={`dash-member-${member.id || 'mem'}-${idx}`} className="relative flex flex-col items-center shrink-0 group">
                <button
                  id={`profile-avatar-${member.id}`}
                  onClick={() => {
                    onSelectMember(member.id);
                    handleOpenAddMemberModal(member.id);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none"
                  title={`${member.name || 'User'} (${member.isPrimary ? 'Self' : member.relationship}) - Click to edit profile & crop photo`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md relative overflow-hidden ${
                      isSelected
                        ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105'
                        : 'hover:scale-102 border border-slate-700'
                    } ${member.avatarBg || 'bg-slate-800'}`}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name || 'User'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-white">
                        {(member.name || 'User').slice(0, 2).toUpperCase()}
                      </span>
                    )}

                    {/* Primary user badge star */}
                    {member.isPrimary && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[7px] text-slate-950 font-black">
                        ★
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <span
                      className={`text-xs truncate max-w-[74px] ${
                        isSelected ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {(member.name || 'User').split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-none">
                      {member.isPrimary ? 'Self' : member.relationship}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Quick Add Member Profile Avatar button */}
          <button
            onClick={() => handleOpenAddMemberModal()}
            id="profile-avatar-add-member"
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            title="Add Family Member"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-slate-900/60 hover:bg-amber-500/10 flex items-center justify-center text-amber-400 transition-all">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-amber-400 group-hover:underline truncate max-w-[74px]">
                + Member
              </span>
              <span className="text-[10px] text-slate-500 leading-none">
                Add Profile
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. DOCUMENT GRID: DEFAULT TILES (Aadhaar, Voter ID, Passport, Driving License, PAN Card) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Identity Cards & Government Documents
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredDocuments.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DEFAULT_CARD_TYPES.map((cardConfig, idx) => {
            const storedDoc = getStoredDocForType(cardConfig.type);
            const docOwner = storedDoc ? members.find((m) => m.id === storedDoc.memberId) : null;

            if (storedDoc) {
              // Stored & Verified Tile
              return (
                <div
                  key={`doc-tile-stored-${cardConfig.type}-${idx}`}
                  id={`doc-tile-${cardConfig.type}`}
                  onClick={() => onOpenDocument(storedDoc)}
                  className={`p-4 rounded-2xl bg-slate-900 border ${cardConfig.colorBorder} transition-all cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 group flex flex-col justify-between relative overflow-hidden`}
                >
                  {/* Subtle top indicator bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cardConfig.badgeColor}`}
                    >
                      {cardConfig.title}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Encrypted
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                      {storedDoc.nameOnDoc}
                    </h3>
                    <div className="font-mono text-sm tracking-wider text-amber-300 font-semibold">
                      {storedDoc.maskedNumber}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {cardConfig.authority}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Profile: <strong className="text-slate-200">{docOwner?.name || 'Primary'}</strong>
                    </span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Card
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            }

            // Un-uploaded Default Tile placeholder (wireframe default tile)
            return (
              <div
                key={`doc-tile-empty-${cardConfig.type}-${idx}`}
                id={`doc-tile-empty-${cardConfig.type}`}
                onClick={() =>
                  onOpenUpload(cardConfig.type, selectedMemberId === 'all' ? undefined : selectedMemberId)
                }
                className="p-4 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {cardConfig.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Tap to Add</span>
                </div>

                <div className="py-2">
                  <h4 className="font-bold text-sm text-slate-300 group-hover:text-white">
                    {cardConfig.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{cardConfig.sub}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Upload / Scan Card
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </div>
            );
          })}

          {/* Any other user-added documents */}
          {customDocuments.map((doc, idx) => {
            const docOwner = members.find((m) => m.id === doc.memberId);
            return (
              <div
                key={`doc-tile-custom-${doc.id || 'doc'}-${idx}`}
                onClick={() => onOpenDocument(doc)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {doc.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Encrypted
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    {doc.nameOnDoc}
                  </h3>
                  <div className="font-mono text-sm tracking-wider text-amber-300 font-semibold">
                    {doc.maskedNumber}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{doc.issuerOrg}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Profile: <strong className="text-slate-200">{docOwner?.name || 'Primary'}</strong>
                  </span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    View Card
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5 BOTTOM BUTTONS: 1.Home, 2.Search, 3.Scan document, 4.Add member, 5.Drive */}
      <BottomNavBar
        onHome={handleHomeClick}
        onSearch={handleOpenSearch}
        onScanDocument={() =>
          onOpenUpload(
            undefined,
            selectedMemberId === 'all' ? undefined : selectedMemberId
          )
        }
        onAddMember={() => setIsAddMemberModalOpen(true)}
        onOpenDrive={onOpenDrive}
        onOpenSettings={() => onOpenSettings?.()}
        activeTab={currentActiveTab}
      />

      {/* 1. Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearch}
        documents={documents}
        members={members}
        onOpenDocument={onOpenDocument}
        onOpenUpload={() =>
          onOpenUpload(
            undefined,
            selectedMemberId === 'all' ? undefined : selectedMemberId
          )
        }
        onSelectMember={(memberId) => {
          onSelectMember(memberId);
          handleCloseSearch();
        }}
        onEditMember={(memberId) => {
          handleCloseSearch();
          handleOpenAddMemberModal(memberId);
        }}
      />

      {/* 3. Add Member / Edit Profiles Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setMemberToEditId(null);
        }}
        onAddMember={(memberData) => {
          if (onAddMember) {
            onAddMember(memberData);
          }
        }}
        members={members}
        onUpdateMember={onUpdateMember}
        onDeleteMember={onDeleteMember}
        initialMemberIdToEdit={memberToEditId}
      />
    </div>
  );
};
