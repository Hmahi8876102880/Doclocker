import React from 'react';
import { Home, Search, ScanLine, UserPlus, FolderArchive } from 'lucide-react';

export interface BottomNavBarProps {
  onHome: () => void;
  onSearch: () => void;
  onScanDocument: () => void;
  onAddMember: () => void;
  onOpenDrive?: () => void;
  onOpenSettings?: () => void;
  activeTab?: 'home' | 'search' | 'scan' | 'member' | 'drive' | 'setting';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onHome,
  onSearch,
  onScanDocument,
  onAddMember,
  onOpenDrive,
  onOpenSettings,
  activeTab = 'home',
}) => {
  const handleDriveClick = () => {
    if (onOpenDrive) {
      onOpenDrive();
    } else if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <nav
      id="dashboard-bottom-nav"
      aria-label="Bottom Navigation Bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl py-2 px-2 sm:px-4 transition-all"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {/* 1. Home */}
        <button
          onClick={onHome}
          id="bottom-nav-home-btn"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-2xl transition-all cursor-pointer group active:scale-95 ${
            activeTab === 'home'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-amber-400'
          }`}
          aria-label="1. Home"
        >
          <div
            className={`w-9 h-7 sm:w-10 sm:h-8 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'home'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm'
                : 'group-hover:bg-slate-800'
            }`}
          >
            <Home
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                activeTab === 'home' ? 'scale-105 stroke-[2.4]' : 'stroke-[2]'
              }`}
            />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-semibold tracking-tight mt-0.5 whitespace-nowrap ${
              activeTab === 'home' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Search */}
        <button
          onClick={onSearch}
          id="bottom-nav-search-btn"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-2xl transition-all cursor-pointer group active:scale-95 ${
            activeTab === 'search'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-amber-400'
          }`}
          aria-label="2. Search"
        >
          <div
            className={`w-9 h-7 sm:w-10 sm:h-8 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'search'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm'
                : 'group-hover:bg-slate-800'
            }`}
          >
            <Search
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                activeTab === 'search' ? 'scale-105 stroke-[2.4]' : 'stroke-[2]'
              }`}
            />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap ${
              activeTab === 'search' ? 'text-amber-400 font-semibold' : 'text-slate-400 group-hover:text-amber-300'
            }`}
          >
            Search
          </span>
        </button>

        {/* 3. Scan document (Prominent Hero Center Action - Big Icon, Small Text) */}
        <button
          onClick={onScanDocument}
          id="bottom-nav-scan-btn"
          className="flex flex-col items-center justify-center flex-1 py-0.5 px-0.5 rounded-2xl text-amber-400 hover:text-amber-300 active:scale-95 transition-all cursor-pointer group"
          aria-label="3. Scan document"
        >
          <div className="w-12 h-9 sm:w-14 sm:h-10 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300/50 transition-all group-hover:shadow-amber-500/50 group-hover:scale-105">
            <ScanLine className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950 transition-transform group-hover:scale-110 stroke-[2.5]" />
          </div>
          <span className="text-[8.5px] sm:text-[9.5px] font-medium tracking-tight mt-0.5 text-amber-400/90 whitespace-nowrap leading-tight">
            Scan document
          </span>
        </button>

        {/* 4. Add member */}
        <button
          onClick={onAddMember}
          id="bottom-nav-add-member-btn"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-2xl transition-all cursor-pointer group active:scale-95 ${
            activeTab === 'member'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-amber-400'
          }`}
          aria-label="4. Add member"
        >
          <div
            className={`w-9 h-7 sm:w-10 sm:h-8 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'member'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm'
                : 'group-hover:bg-slate-800'
            }`}
          >
            <UserPlus
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                activeTab === 'member' ? 'scale-105 stroke-[2.4]' : 'stroke-[2]'
              }`}
            />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap ${
              activeTab === 'member' ? 'text-amber-400 font-semibold' : 'text-slate-400 group-hover:text-amber-300'
            }`}
          >
            Add member
          </span>
        </button>

        {/* 5. DocDrive (Attractive Unofficial documents & photo vault button) */}
        <button
          onClick={handleDriveClick}
          id="bottom-nav-drive-btn"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-2xl transition-all cursor-pointer group active:scale-95 ${
            activeTab === 'drive'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-amber-300'
          }`}
          aria-label="5. DocDrive"
          title="DocDrive - Unofficial Document Vault"
        >
          <div
            className={`w-10 h-7 sm:w-11 sm:h-8 flex items-center justify-center rounded-xl transition-all relative ${
              activeTab === 'drive'
                ? 'bg-gradient-to-tr from-amber-500/35 via-amber-500/25 to-amber-600/40 border border-amber-400/90 text-amber-300 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/40'
                : 'bg-gradient-to-tr from-slate-850 to-slate-800/90 border border-slate-700/80 group-hover:border-amber-500/50 group-hover:bg-slate-800 text-slate-300 group-hover:text-amber-300 shadow-sm'
            }`}
          >
            <FolderArchive
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                activeTab === 'drive' ? 'scale-110 stroke-[2.5] text-amber-300' : 'group-hover:scale-105 stroke-[2]'
              }`}
            />
          </div>
          <span
            className="text-[9px] sm:text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap flex items-center"
          >
            <span
              className={
                activeTab === 'drive'
                  ? 'text-amber-300 font-extrabold'
                  : 'text-slate-300 group-hover:text-amber-300 font-bold'
              }
            >
              DocDrive
            </span>
          </span>
        </button>
      </div>
    </nav>
  );
};
