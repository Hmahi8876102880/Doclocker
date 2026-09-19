import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  FolderLock,
  Sparkles,
} from 'lucide-react';
import { IndianDocument, FamilyMember, DocumentType } from '../types';
import { ALL_INDIAN_OFFICIAL_DOCUMENTS, OfficialDocumentItem } from '../data/officialIndianDocuments';
import { BottomNavBar } from './BottomNavBar';

interface AllDocumentsScreenProps {
  documents: IndianDocument[];
  members: FamilyMember[];
  onBack: () => void;
  onOpenDocument: (doc: IndianDocument) => void;
  onOpenUpload: (type?: DocumentType, targetMemberId?: string) => void;
  onHome: () => void;
  onSearch: () => void;
  onAddMember: () => void;
  onOpenDrive?: () => void;
  onOpenSettings: () => void;
}

type TabMode = 'all' | 'saved' | 'official';
type CategoryFilter = 'All' | 'Identity' | 'Transport' | 'Civil & Health' | 'Education & Social';

export const AllDocumentsScreen: React.FC<AllDocumentsScreenProps> = ({
  documents,
  members,
  onBack,
  onOpenDocument,
  onOpenUpload,
  onHome,
  onSearch,
  onAddMember,
  onOpenDrive,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Map member names for fast lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.name || (m.isPrimary ? 'Primary' : m.relationship)));
    return map;
  }, [members]);

  // Filter saved vault documents
  const filteredSavedDocs = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const title = doc.title.toLowerCase();
      const num = (doc.documentNumber || '').toLowerCase();
      const name = (doc.nameOnDoc || '').toLowerCase();
      const type = doc.type.toLowerCase();
      const memName = (memberMap.get(doc.memberId) || '').toLowerCase();
      return title.includes(q) || num.includes(q) || name.includes(q) || type.includes(q) || memName.includes(q);
    });
  }, [documents, searchQuery, memberMap]);

  // Filter official Indian IDs directory
  const filteredOfficialDocs = useMemo(() => {
    return ALL_INDIAN_OFFICIAL_DOCUMENTS.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
        return false;
      }
      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.shortName.toLowerCase().includes(q) ||
        doc.authority.toLowerCase().includes(q) ||
        doc.purpose.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // Quick helper to check if an official document is already stored in vault
  const findStoredDocForOfficial = (offDoc: OfficialDocumentItem): IndianDocument | undefined => {
    if (!offDoc.docTypeKey) return undefined;
    return documents.find((d) => d.type === offDoc.docTypeKey);
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-4 sm:py-6 pb-32 selection:bg-amber-500 selection:text-white">
      {/* Top Breadcrumb & Quick Action Row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          id="btn-all-docs-back"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ডেশ্ববৰ্ডলৈ উভতি যাওক (Back to Dashboard)</span>
        </button>

        <button
          onClick={() => onOpenUpload()}
          id="btn-all-docs-upload-top"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* Page Title & Stats Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FolderLock className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  All Documents (সকলো নথি)
                </h1>
                <p className="text-xs text-slate-400">
                  নিৰাপদ অন-ডিভাইচ ভল্ট আৰু ভাৰত চৰকাৰৰ ১৮ বিধ আধিকাৰিক নথি
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xs font-bold text-amber-400">{documents.length}</div>
              <div className="text-[10px] text-slate-400">Saved in Vault</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xs font-bold text-emerald-400">{ALL_INDIAN_OFFICIAL_DOCUMENTS.length}</div>
              <div className="text-[10px] text-slate-400">Official IDs</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('all')}
            id="tab-all-documents"
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Overview ({documents.length + ALL_INDIAN_OFFICIAL_DOCUMENTS.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            id="tab-saved-documents"
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Saved in Vault</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900/60 font-mono">
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('official')}
            id="tab-official-documents"
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'official'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Official 18 IDs Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900/60 font-mono">
              18
            </span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Aadhaar, PAN, Voter, Driving License, Passport, ABHA, RC..."
          id="all-docs-search-input"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills (Visible when viewing official or all tabs) */}
      {activeTab !== 'saved' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0 text-[11px] mr-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {(['All', 'Identity', 'Transport', 'Civil & Health', 'Education & Social'] as CategoryFilter[]).map(
            (cat, idx) => (
              <button
                key={`cat-pill-${cat}-${idx}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      )}

      {/* SECTION 1: SAVED VAULT DOCUMENTS */}
      {(activeTab === 'all' || activeTab === 'saved') && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Saved Vault Documents ({filteredSavedDocs.length})
              </h2>
            </div>
            {filteredSavedDocs.length > 0 && (
              <span className="text-[11px] text-emerald-400 font-medium">✓ AES-256 Protected</span>
            )}
          </div>

          {filteredSavedDocs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
              <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                {searchQuery
                  ? `"${searchQuery}" সম্পৰ্কীয় কোনো সংৰক্ষিত নথি পোৱা নগল`
                  : 'বৰ্তমান কোনো নথি সংৰক্ষণ কৰা হোৱা নাই (No documents saved in vault yet)'}
              </p>
              <button
                onClick={() => onOpenUpload()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                + প্ৰথম নথি আপলোড কৰক (Upload Document)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSavedDocs.map((doc, idx) => {
                const holderName = memberMap.get(doc.memberId) || 'Personal';

                return (
                  <div
                    key={`saved-doc-${doc.id || 'doc'}-${idx}`}
                    onClick={() => onOpenDocument(doc)}
                    id={`all-doc-item-${doc.id}`}
                    className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Encrypted
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {doc.nameOnDoc || doc.title}
                      </div>

                      <div className="text-xs font-mono text-slate-400 tracking-wider mt-1">
                        {doc.documentNumber || 'XXXX XXXX XXXX'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-400">
                        Profile: <span className="text-slate-300 font-semibold">{holderName}</span>
                      </div>
                      <div className="text-amber-400 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Card</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: OFFICIAL INDIAN 18 DOCUMENTS DIRECTORY */}
      {(activeTab === 'all' || activeTab === 'official') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Indian Documents Directory ({filteredOfficialDocs.length} IDs)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">All India Statutory IDs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredOfficialDocs.map((offDoc, idx) => {
              const savedInVault = findStoredDocForOfficial(offDoc);

              return (
                <div
                  key={`official-dir-doc-${offDoc.id}-${idx}`}
                  id={`official-doc-item-${offDoc.id}`}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {offDoc.category}
                      </span>
                      {savedInVault ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Saved in Vault
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Not Added</span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white">{offDoc.name}</h3>
                    <p className="text-[11px] text-amber-400/90 font-medium">
                      Authority: {offDoc.authority}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {offDoc.purpose}
                    </p>

                    <div className="pt-1 flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Format: {offDoc.format.slice(0, 30)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <a
                      href={offDoc.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Visit official portal"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Govt Portal</span>
                    </a>

                    {savedInVault ? (
                      <button
                        onClick={() => onOpenDocument(savedInVault)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>View Card</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenUpload(offDoc.docTypeKey)}
                        className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add to Vault</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5 BOTTOM BUTTONS */}
      <BottomNavBar
        onHome={onHome}
        onSearch={onSearch}
        onScanDocument={() => onOpenUpload()}
        onAddMember={onAddMember}
        onOpenDrive={onOpenDrive}
        onOpenSettings={onOpenSettings}
        activeTab="home"
      />
    </div>
  );
};
