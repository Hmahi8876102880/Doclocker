import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smartphone, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';

interface AuthOtpModalProps {
  onSuccess: (phone: string, pin: string) => void;
  onBack: () => void;
  defaultPhone?: string;
  defaultPin?: string;
}

export const AuthOtpModal: React.FC<AuthOtpModalProps> = ({
  onSuccess,
  onBack,
  defaultPhone = '9876543210',
  defaultPin = '1234',
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState(defaultPin);
  const [confirmPin, setConfirmPin] = useState(defaultPin);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setDebugOtp(data.debugOtp || null);
      setOtp(['', '', '', '']);
      setIsSendingOtp(false);
      setStep('otp');
      setCountdown(60);
      setTimeout(() => {
        const input0 = document.getElementById('otp-input-0');
        input0?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || 'Error sending OTP');
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const entered = otp.join('');
    if (entered.length < 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }
    setError(null);
    setIsVerifying(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: entered }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code');
      }
      setStep('pin');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompletePinSetup = () => {
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match. Please verify.');
      return;
    }
    onSuccess(`+91 ${phoneNumber}`, pin);
  };

  const fillDemoOtp = () => {
    if (debugOtp) {
      setOtp(debugOtp.split(''));
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === 'pin') setStep('otp');
            else if (step === 'otp') setStep('phone');
            else onBack();
          }}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex justify-center items-center gap-2 mb-8 pt-1">
          <div className={`h-1.5 rounded-full transition-all ${step === 'phone' ? 'w-8 bg-amber-500' : 'w-2 bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 'otp' ? 'w-8 bg-amber-500' : step === 'pin' ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 'pin' ? 'w-8 bg-amber-500' : 'w-2 bg-slate-700'}`} />
        </div>

        {/* STEP 1: MOBILE NUMBER */}
        {step === 'phone' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Smartphone className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Mobile Verification</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your mobile number linked with Aadhaar or digital records
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mobile Number
              </label>
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 focus-within:border-amber-500 rounded-2xl px-4 py-3.5 transition-colors">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-base pr-3 border-r border-slate-700">
                  <span className="text-xs">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  id="mobile-number-input"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-white placeholder-slate-500 font-mono text-base focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400">
                We will send an instant one-time password (OTP) via SMS for verification.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              id="send-otp-btn"
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSendingOtp ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>Request OTP</span>
              )}
            </button>
          </motion.div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Enter 4-Digit OTP</h2>
              <p className="text-sm text-slate-400 mt-1">
                Sent to <span className="font-mono text-slate-200">+91 {phoneNumber}</span>
              </p>
            </div>

            {/* OTP Status / Helper Banner */}
            {debugOtp && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs text-slate-300 font-mono">
                    Testing OTP: <strong className="text-amber-400 font-bold tracking-widest">{debugOtp}</strong>
                  </span>
                </div>
                <button
                  onClick={fillDemoOtp}
                  className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40 transition-colors font-medium cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* 4 Digit Inputs */}
            <div className="flex justify-center gap-3 sm:gap-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && idx > 0) {
                      const prev = document.getElementById(`otp-input-${idx - 1}`);
                      prev?.focus();
                    }
                  }}
                  className="w-14 sm:w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-amber-500 text-center font-mono text-2xl text-white font-bold focus:outline-none transition-colors shadow-inner"
                />
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Didn't receive code?</span>
              {countdown > 0 ? (
                <span className="text-slate-500">Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              id="verify-otp-btn"
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Verify & Continue</span>
            </button>
          </motion.div>
        )}

        {/* STEP 3: SET 4-DIGIT APP LOCK PIN */}
        {step === 'pin' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Setup 4-Digit PIN</h2>
              <p className="text-sm text-slate-400 mt-1">
                This PIN encrypts your documents locally via AES-256 on this device.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
                  Create 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  id="setup-pin-input"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="••••"
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-center font-mono text-2xl tracking-widest text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  id="confirm-pin-input"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="••••"
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-center font-mono text-2xl tracking-widest text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-[11px] text-slate-400 leading-relaxed">
              🔒 <strong>On-Device Encryption:</strong> Your PIN is used with PBKDF2 to derive your master AES-GCM 256-bit encryption key. Nobody, not even our servers, can decrypt your cards without this PIN.
            </div>

            <button
              onClick={handleCompletePinSetup}
              id="confirm-vault-pin-btn"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Enter Secure Vault</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
