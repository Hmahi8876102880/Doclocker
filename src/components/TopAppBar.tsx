import React from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onOpenMenu?: () => void;
  onBack?: () => void;
  showBack?: boolean;
  onSearch?: () => void;
  userPhoto?: string;
  userName?: string;
  onOpenProfile?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  onOpenMenu,
  userPhoto,
  userName,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2 sm:py-2.5 text-white transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Back button, Logo mark & Title */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && onBack && (
            <button
              onClick={onBack}
              id="top-bar-back-btn"
              className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <AppLogo size="sm" showText={false} />

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Enlarged User Profile Photo (Clean, without setting icon) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfile || onOpenMenu}
            id="top-bar-profile-btn"
            className="relative flex items-center justify-center rounded-full p-0.5 ring-2 sm:ring-[2.5px] ring-amber-400/50 hover:ring-amber-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-black/40 group"
            aria-label="User Profile & Settings"
            title={userName ? `${userName} - Profile & Settings` : 'User Profile & Settings'}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800 border-2 border-slate-700/90 overflow-hidden flex items-center justify-center text-amber-300 font-bold shadow-inner">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName || 'User Profile'}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : userName?.trim() ? (
                <span className="text-sm sm:text-base tracking-wider font-extrabold text-amber-300">
                  {userName.trim().slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
