import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, Smartphone, X } from 'lucide-react';

interface ScreenshotShieldProps {
  enabled: boolean;
  isTriggered: boolean;
  onDismiss: () => void;
}

export const ScreenshotShield: React.FC<ScreenshotShieldProps> = ({
  enabled,
  isTriggered,
  onDismiss,
}) => {
  const [internalBlocked, setInternalBlocked] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Listen for common screen capture keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        e.preventDefault();
        setInternalBlocked(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  const shouldShow = enabled && (isTriggered || internalBlocked);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-2xl animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold mb-3 border border-rose-500/30">
            FLAG_SECURE ENFORCED
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Screenshot Blocked</h2>
          <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed mb-6">
            Sensitive identity documents are protected under the <strong>Digital Personal Data Protection (DPDP) Act</strong>. Screen capturing, recording, and broadcasting are strictly disabled.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 max-w-sm w-full mb-6">
            <div className="flex items-center justify-between text-slate-400">
              <span>Security Policy:</span>
              <span className="text-white font-mono">ENCRYPTED_VAULT_P0</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Display Shield:</span>
              <span className="text-emerald-400 font-mono">100% OPAQUE</span>
            </div>
          </div>

          <button
            onClick={() => {
              setInternalBlocked(false);
              onDismiss();
            }}
            className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700 cursor-pointer"
          >
            Return to Vault
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
