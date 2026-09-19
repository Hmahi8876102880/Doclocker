import React, { useState } from 'react';
import { WifiOff, Wifi, ShieldCheck, CheckCircle2, Info, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineStatusBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // If offline, always show an informative, comforting badge that everything is working 100%
  if (!isOnline) {
    return (
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-2 max-w-2xl">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-white font-semibold">No Internet Connection Detected</strong>
            <span className="hidden sm:inline text-emerald-300 ml-1">
              — 100% Offline Vault active. All documents, cards, and member data remain fully accessible and encrypted on your device.
            </span>
            <span className="sm:hidden text-emerald-300 ml-1">
              — Offline Vault active. Zero internet required.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
            OFFLINE OK
          </span>
        </div>
      </div>
    );
  }

  // When online, show an dismissible subtle assurance indicator
  if (dismissed) return null;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-300 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 truncate">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="truncate">
          <strong className="text-amber-400 font-medium">100% Offline Capable:</strong> This app runs entirely without internet. No data is ever sent to external servers.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
          LOCAL ENCRYPTION
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
