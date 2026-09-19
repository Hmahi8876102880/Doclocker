import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, ShieldCheck, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' | 'badge' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed standalone PWA app
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed Offline App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers that don't emit beforeinstallprompt in iframe/preview
      setShowIOSGuide(true);
    }
  };

  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          id="pwa-install-badge-btn"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
          title="Install for 100% offline access from homescreen"
        >
          <Download className="w-3 h-3" />
          <span>Install Offline App</span>
        </button>

        {showIOSGuide && (
          <InstallInstructionsModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 text-left relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>Use 100% Offline via App Install</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
              No Wi-Fi Needed
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
            Install <strong>DocLocker</strong> onto your home screen or desktop to open and manage all documents without any internet connection.
          </p>

          <button
            onClick={handleInstallClick}
            id="pwa-install-card-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on Device / Home Screen</span>
          </button>
        </div>

        {showIOSGuide && (
          <InstallInstructionsModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Default compact button (for top bar or menu)
  return (
    <>
      <button
        onClick={handleInstallClick}
        id="pwa-install-compact-btn"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App (Offline Ready)</span>
      </button>

      {showIOSGuide && (
        <InstallInstructionsModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

const InstallInstructionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Install for 100% Offline Use</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Once installed, this app operates entirely <strong>without any mobile data or Wi-Fi connection</strong>. All documents are stored securely inside your local encrypted storage.
        </p>

        <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <div className="font-semibold text-white text-[11px] uppercase tracking-wider text-amber-400">
            How to Install:
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <span>
              On <strong>Android / Chrome</strong>: Tap the three dots menu (<strong className="text-white">⋮</strong>) and choose <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home Screen"</strong>.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <span>
              On <strong>iPhone / Safari</strong>: Tap the <strong className="text-white">Share</strong> button (<Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" />) at the bottom, scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-white mx-0.5" />).
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <span>
              On <strong>Desktop (Chrome/Edge)</strong>: Click the <strong>Install icon</strong> in the browser URL address bar.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
