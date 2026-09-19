import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  AlertCircle,
  KeyRound,
  HelpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: (enteredPin?: string) => Promise<boolean> | void;
  onResetAuth: () => void;
  biometricsEnabled?: boolean;
  onUpdatePin?: (newPin: string) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  onUnlock,
  onResetAuth,
  onUpdatePin,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus native device numeric keyboard on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = async (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
    setEnteredPin(digitsOnly);
    setErrorMsg(null);

    if (digitsOnly.length === 4) {
      const activePin = correctPin || localStorage.getItem('doclocker_app_pin') || '1234';

      // Strict validation: if entered digits don't match the active real PIN, reject immediately!
      if (digitsOnly !== activePin) {
        setErrorShake(true);
        setErrorMsg('ভুল PIN! অনুগ্ৰহ কৰি সঠিক PIN দিয়ক (Incorrect PIN)');
        setTimeout(() => {
          setEnteredPin('');
          setErrorShake(false);
          inputRef.current?.focus();
        }, 600);
        return;
      }

      const result = onUnlock(digitsOnly);
      if (result instanceof Promise) {
        const success = await result;
        if (!success) {
          setErrorShake(true);
          setErrorMsg('ভুল PIN! অনুগ্ৰহ কৰি সঠিক PIN দিয়ক (Incorrect PIN)');
          setTimeout(() => {
            setEnteredPin('');
            setErrorShake(false);
            inputRef.current?.focus();
          }, 600);
        }
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    const activeCorrectPin = correctPin || localStorage.getItem('doclocker_app_pin') || '1234';

    if (currentPinInput !== activeCorrectPin) {
      setModalError('Current PIN is incorrect (বৰ্তমানৰ PIN ভুল হৈছে)');
      return;
    }

    if (newPinInput.length !== 4) {
      setModalError('New PIN must be exactly 4 digits (৪-অংকৰ হ’ব লাগিব)');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setModalError('New PIN and Confirm PIN do not match (দুয়োটা PIN একে হ’ব লাগিব)');
      return;
    }

    // Success! Update PIN
    localStorage.setItem('doclocker_app_pin', newPinInput);
    if (onUpdatePin) {
      onUpdatePin(newPinInput);
    }

    setModalSuccess('PIN successfully updated! (নতুন PIN সংৰক্ষণ হ’ল)');

    setTimeout(async () => {
      setShowSetPinModal(false);
      setEnteredPin(newPinInput);
      await onUnlock(newPinInput);
    }, 1000);
  };

  return (
    <div
      onClick={focusInput}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center px-4 py-8 relative selection:bg-amber-500 selection:text-white cursor-pointer"
    >
      {/* Hidden input to trigger native device digit keypad */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={enteredPin}
        onChange={(e) => handlePinChange(e.target.value)}
        autoFocus
        autoComplete="one-time-code"
        className="opacity-0 absolute -top-9999 left-0 w-1 h-1 pointer-events-none"
        aria-label="Enter 4-digit PIN"
      />

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400 pt-2 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="font-mono text-[11px]">AES-256 Armed</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DPDP Secure</span>
        </div>
      </header>

      {/* Center PIN visual */}
      <main className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 z-10">
        {/* Beautiful "DocLocker" Name at Top Section */}
        <div className="flex flex-col items-center mb-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center">
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(245,158,11,0.35)]">
              DocLocker
            </span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium tracking-wide uppercase mt-0.5">
            Offline Document &amp; ID Vault
          </p>
        </div>

        <div className="mb-4 relative">
          <AppLogo size="xl" showText={false} />
          <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-lg border border-slate-700 shadow-md">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          Enter PIN
        </h2>
        <p className="text-xs text-slate-400 mb-8 text-center">
          DocLocker is locked. Enter 4-digit PIN using your device keypad.
        </p>

        {/* 4 Large Device Digit PIN Boxes */}
        <motion.div
          animate={errorShake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          onClick={(e) => {
            e.stopPropagation();
            focusInput();
          }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-6"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            const isCurrent = index === enteredPin.length;

            return (
              <div
                key={index}
                className={`w-14 h-16 sm:w-16 sm:h-18 rounded-2xl flex items-center justify-center text-3xl font-mono font-bold transition-all border ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400/30'
                    : isFilled
                    ? 'border-amber-500/60 bg-slate-900/95 text-amber-300 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-600'
                }`}
              >
                {isFilled ? (
                  <span className="text-amber-400 select-none">●</span>
                ) : isCurrent ? (
                  <span className="w-2 h-6 bg-amber-400/80 rounded-full animate-pulse" />
                ) : null}
              </div>
            );
          })}
        </motion.div>

        {/* Error message or spacing (Keypad button hidden as requested) */}
        <div className="min-h-[28px] flex items-center justify-center mb-4">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-rose-400 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer: Forget PIN and Set PIN buttons (borderless, elegant, smaller Forget PIN text) */}
      <footer className="w-full max-w-sm flex items-center justify-center gap-2.5 pt-4 pb-2 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onResetAuth();
          }}
          id="pin-screen-forget-pin-btn"
          className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 active:bg-slate-800 active:scale-95 text-slate-300 hover:text-amber-300 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-black/30 backdrop-blur-md group"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 transition-colors shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium tracking-wide">Forget PIN</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setModalError(null);
            setModalSuccess(null);
            setCurrentPinInput('');
            setNewPinInput('');
            setConfirmPinInput('');
            setShowSetPinModal(true);
          }}
          id="pin-screen-set-pin-btn"
          className="flex-1 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900/80 to-amber-500/15 hover:from-amber-500/30 hover:via-slate-850 hover:to-amber-500/25 active:scale-95 text-amber-200 hover:text-amber-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/30 backdrop-blur-md group"
        >
          <KeyRound className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide">Set PIN</span>
        </button>
      </footer>

      {/* Set PIN Modal Dialog */}
      <AnimatePresence>
        {showSetPinModal && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black/70 relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSetPinModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Set 4-Digit PIN</h3>
                  <p className="text-xs text-slate-400">নতুন ৪-অংকৰ Login PIN নিৰ্ধাৰণ কৰক</p>
                </div>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSetPinSubmit} className="space-y-4">
                {/* Current PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>বৰ্তমানৰ PIN (Current PIN)</span>
                    <span className="text-[10px] text-slate-400">৪-অংক</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-base tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* New PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>নতুন ৪-অংকৰ PIN (New PIN)</span>
                    <span className="text-[10px] text-amber-400 font-mono">৪-অংক</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-base tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Confirm New PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    নতুন PIN নিশ্চিত কৰক (Confirm New PIN)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-base tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PIN সংৰক্ষণ কৰক (Save &amp; Unlock)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSetPinModal(false);
                      onResetAuth();
                    }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-center"
                  >
                    বৰ্তমানৰ PIN মনত নাই? OTP দ্বাৰা ৰিছেট কৰক →
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
