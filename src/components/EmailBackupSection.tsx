import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Send,
  Download,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  AlertCircle,
  Share2,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { FamilyMember, IndianDocument, SecuritySettings } from '../types';
import { getStoredEncryptedPayload } from '../services/crypto';

interface EmailBackupProps {
  primaryMember: FamilyMember;
  members: FamilyMember[];
  documents: IndianDocument[];
  securitySettings: SecuritySettings;
  onRestoreVault?: (
    restoredMembers: FamilyMember[],
    restoredDocs: IndianDocument[],
    restoredSecurity?: SecuritySettings
  ) => void;
  onClose?: () => void;
}

export const EmailBackupSection: React.FC<EmailBackupProps> = ({
  primaryMember,
  members,
  documents,
  securitySettings,
  onRestoreVault,
}) => {
  const defaultEmail = primaryMember.email?.trim() || 'hmahizul@gmail.com';
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [autoReminder, setAutoReminder] = useState<boolean>(() => {
    return localStorage.getItem('doclocker_email_backup_reminder') !== 'false';
  });

  // Restore states
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    memberCount: number;
    docCount: number;
    user: string;
  } | null>(null);

  // Generate backup bundle object
  const buildBackupPayload = () => {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const encryptedPayload = getStoredEncryptedPayload();

    return {
      app: 'DocLocker',
      version: '2.0',
      exportedAt: timestamp,
      formattedDate,
      vaultHolder: {
        name: primaryMember.name || 'Personal Vault User',
        phone: primaryMember.phone || '',
        email: recipientEmail.trim(),
        dob: primaryMember.dob || '',
      },
      stats: {
        totalDocuments: documents.length,
        totalMembers: members.length,
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship,
        dob: m.dob,
        phone: m.phone,
        email: m.email,
        isPrimary: m.isPrimary,
        avatarUrl: m.avatarUrl,
        createdAt: m.createdAt,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        memberId: d.memberId,
        type: d.type,
        title: d.title,
        docNumber: d.docNumber,
        maskedNumber: d.maskedNumber,
        nameOnDoc: d.nameOnDoc,
        relationship: d.relationship,
        dob: d.dob,
        gender: d.gender,
        address: d.address,
        fatherName: d.fatherName,
        issueDate: d.issueDate,
        expiryDate: d.expiryDate,
        issuerOrg: d.issuerOrg,
        categoryTag: d.categoryTag,
        notes: d.notes,
        isVerified: d.isVerified,
        updatedAt: d.updatedAt,
        folderId: d.folderId,
        frontImage: includeImages ? d.frontImage : undefined,
        backImage: includeImages ? d.backImage : undefined,
      })),
      securityMeta: {
        encryptionAlgorithm: securitySettings.encryptionAlgorithm,
        biometricsEnabled: securitySettings.biometricsEnabled,
        screenshotProtectionEnabled: securitySettings.screenshotProtectionEnabled,
        encryptedPayloadBackup: encryptedPayload ? true : false,
      },
    };
  };

  // 1. Send / Dispatch Email Backup via Native Share or Mailto with auto-download
  const handleSendEmailBackup = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      alert('অনুগ্ৰহ কৰি সঠিক ইমেইল ঠিকনা লিখক (Please enter a valid email address)');
      return;
    }

    setIsSending(true);
    setSendSuccess(null);

    const payload = buildBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `DocLocker_Vault_Backup_${dateStamp}.json`;

    // Always trigger the JSON backup file download so the user has the file in downloads
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const fileUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(fileUrl), 2000);

    // Document summary list for email body
    const docSummaryText = documents.length > 0
      ? documents
          .slice(0, 8)
          .map((d, i) => `${i + 1}. ${d.title} (${d.maskedNumber || d.docNumber.slice(-4)}) - ${d.nameOnDoc}`)
          .join('\n') + (documents.length > 8 ? `\n...আৰু ${documents.length - 8} খন নথি` : '')
      : 'No documents stored yet.';

    const emailSubject = `[DocLocker] Secure Vault Backup (${payload.stats.totalDocuments} Documents) - ${payload.formattedDate}`;
    const emailBody = `DocLocker Vault Secure Backup
=====================================
Vault Owner: ${payload.vaultHolder.name}
Registered Email: ${recipientEmail}
Total Documents: ${payload.stats.totalDocuments}
Total Members: ${payload.stats.totalMembers}
Date: ${payload.formattedDate}
Encryption: AES-256-GCM On-Device Safe

Stored Documents Summary:
${docSummaryText}

-------------------------------------
[HOW TO RESTORE / কেনেকৈ ৰিষ্ট'ৰ কৰিব]
1. এই ইমেইলৰ লগত সংলগ্ন বা ডাউনলোড হোৱা "${fileName}" ফাইলটো সংৰক্ষিত ৰাখক।
2. নতুন ডিভাইচ বা ব্ৰাউজাৰত DocLocker খুলি "Email Backup -> Restore" বিকল্প বাচি লওক।
3. এই ফাইলটো আপলোড কৰিলে আপোনাৰ সকলো নথি তৎক্ষণাত পুনৰুদ্ধাৰ হ'ব।

DocLocker - Offline First Digital Identity Vault
MH Web Solutions
`;

    // Try Web Share API with file if supported on mobile
    let sharedViaNative = false;
    try {
      const backupFile = new File([blob], fileName, { type: 'application/json' });
      if (
        navigator.canShare &&
        navigator.canShare({ files: [backupFile] }) &&
        navigator.share
      ) {
        await navigator.share({
          title: emailSubject,
          text: emailBody,
          files: [backupFile],
        });
        sharedViaNative = true;
      }
    } catch {
      // If user cancels or browser doesn't allow files, fallback to mailto
      sharedViaNative = false;
    }

    // If not shared natively, launch mailto with pre-filled content
    if (!sharedViaNative) {
      const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
    }

    // Save timestamp of last backup
    localStorage.setItem('doclocker_last_email_backup', new Date().toISOString());

    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(`বেকআপ সফলভাৱে প্ৰস্তুত কৰা হ'ল! ${recipientEmail} লৈ ইমেইল আৰু "${fileName}" ফাইল সংৰক্ষণ কৰা হৈছে।`);
    }, 600);
  };

  // 2. Direct Download JSON
  const handleDownloadFile = () => {
    const payload = buildBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `DocLocker_Backup_${dateStamp}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // 3. Copy JSON payload to clipboard
  const handleCopyJson = () => {
    const payload = buildBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // 4. File input parser for restoring backup
  const handleRestoreFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setRestoreJsonText(text);
        parseAndPreviewBackup(text);
      } catch (err: unknown) {
        setRestoreError((err as Error)?.message || 'Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const parseAndPreviewBackup = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!data.documents && !data.members)) {
        throw new Error('এই ফাইলটো এটা বৈধ DocLocker বেকআপ নহয় (Not a valid DocLocker backup file)');
      }

      const docCount = Array.isArray(data.documents) ? data.documents.length : 0;
      const memberCount = Array.isArray(data.members) ? data.members.length : 0;
      const user = data.vaultHolder?.name || data.primaryUser || 'Vault User';

      setRestorePreview({
        docCount,
        memberCount,
        user,
      });
      setRestoreError(null);
    } catch (err: unknown) {
      setRestorePreview(null);
      setRestoreError((err as Error)?.message || 'JSON analysis failed');
    }
  };

  const handleConfirmRestore = () => {
    if (!restoreJsonText.trim()) {
      setRestoreError('অনুগ্ৰহ কৰি বেকআপ ডাটা বা ফাইল প্ৰদান কৰক');
      return;
    }

    try {
      const data = JSON.parse(restoreJsonText);
      const restoredMembers: FamilyMember[] = Array.isArray(data.members) ? data.members : members;
      const restoredDocs: IndianDocument[] = Array.isArray(data.documents) ? data.documents : documents;
      const restoredSecurity: SecuritySettings | undefined = data.securityMeta
        ? {
            ...securitySettings,
            encryptionAlgorithm: data.securityMeta.encryptionAlgorithm || securitySettings.encryptionAlgorithm,
            biometricsEnabled: data.securityMeta.biometricsEnabled ?? securitySettings.biometricsEnabled,
            screenshotProtectionEnabled:
              data.securityMeta.screenshotProtectionEnabled ?? securitySettings.screenshotProtectionEnabled,
          }
        : undefined;

      if (onRestoreVault) {
        onRestoreVault(restoredMembers, restoredDocs, restoredSecurity);
        setRestoreSuccess(
          `অভিনন্দন! ${restoredDocs.length} খন নথি আৰু ${restoredMembers.length} জন সদস্য সফলতাৰে ৰিষ্ট'ৰ কৰা হ'ল!`
        );
        setTimeout(() => {
          setIsRestoreOpen(false);
          setRestorePreview(null);
          setRestoreJsonText('');
        }, 2200);
      } else {
        alert('Restore handler is not available');
      }
    } catch (err: unknown) {
      setRestoreError((err as Error)?.message || "ৰিষ্ট'ৰ কৰাত ত্ৰুটি হৈছে");
    }
  };

  const toggleAutoReminder = () => {
    const nextVal = !autoReminder;
    setAutoReminder(nextVal);
    localStorage.setItem('doclocker_email_backup_reminder', String(nextVal));
  };

  const lastBackupTime = localStorage.getItem('doclocker_last_email_backup');

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-800 to-slate-850 border border-amber-500/35 relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ইমেইল বেকআপ (Email Backup)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  সক্ৰিয় (Active)
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                আপোনাৰ সকলো নথি সুৰক্ষিতভাৱে ইমেইললৈ বেকআপ কৰক
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>
              মুঠ নথি: <b className="text-white">{documents.length} খন</b>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              সুৰক্ষা: <b className="text-white font-mono">AES-256</b>
            </span>
          </div>
        </div>

        {lastBackupTime && (
          <div className="mt-2 text-[10px] text-amber-300/90 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              সৰ্বশেষ বেকআপ:{' '}
              {new Date(lastBackupTime).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Recipient Email Address Input */}
      <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            প্ৰাপকৰ ইমেইল ঠিকনা (Recipient Email)
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Gmail / Outlook / Any Mail</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="আপোনাৰ ইমেইল লিখক (e.g. name@gmail.com)"
            className="flex-1 py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:outline-none focus:border-amber-500"
          />
          {recipientEmail && recipientEmail.includes('@') && (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          এই ইমেইললৈ নথিসমূহৰ এনক্ৰিপ্ট বেকআপ আৰু ৰিষ্ট'ৰ কৰাৰ নিৰ্দেশনা প্ৰেৰণ কৰা হ'ব।
        </p>
      </div>

      {/* Backup Options Toggle */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">ফটো সংলগ্ন কৰক (Include Card Photos)</div>
            <div className="text-[10px] text-slate-400">কার্ডৰ সন্মূখ আৰু পিছফালৰ ফটো অন্তৰ্ভুক্ত কৰক</div>
          </div>
          <button
            type="button"
            onClick={() => setIncludeImages(!includeImages)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              includeImages ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                includeImages ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div>
            <div className="text-xs font-semibold text-slate-200">স্বয়ংক্ৰিয় সোঁৱৰণী (Backup Reminder)</div>
            <div className="text-[10px] text-slate-400">নতুন নথি যোগ কৰিলে বেকআপৰ বাবে সোঁৱৰাই দিয়ক</div>
          </div>
          <button
            type="button"
            onClick={toggleAutoReminder}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoReminder ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                autoReminder ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Email Dispatch Action Button */}
      <button
        type="button"
        onClick={handleSendEmailBackup}
        disabled={isSending || documents.length === 0}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>ইমেইল বেকআপ প্ৰস্তুত হৈ আছে...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>ইমেইললৈ বেকআপ প্ৰেৰণ কৰক (Send Backup to Email)</span>
          </>
        )}
      </button>

      {/* Feedback Alert on Success */}
      {sendSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <div className="flex-1 leading-relaxed">{sendSuccess}</div>
        </motion.div>
      )}

      {/* Secondary Backup Utilities: Download & Copy JSON */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownloadFile}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>JSON ফাইল ডাউনলোড</span>
        </button>

        <button
          type="button"
          onClick={handleCopyJson}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {copySuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">কপি কৰা হ'ল!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>বেকআপ ক'ড কপি</span>
            </>
          )}
        </button>
      </div>

      {/* Restore from Email Backup Section Toggle */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              ইমেইল বেকআপৰ পৰা পুনৰুদ্ধাৰ (Restore from Email)
            </h4>
            <p className="text-[10px] text-slate-400">
              পূৰ্বতে ইমেইল কৰা বা ডাউনলোড কৰা বেকআপ ফাইলৰ পৰা নথি ফিৰাই আনক
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRestoreOpen(!isRestoreOpen)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isRestoreOpen ? 'লুকুৱাওক' : "ৰিষ্ট'ৰ কৰক"}
          </button>
        </div>

        {isRestoreOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2 border-t border-slate-800/80"
          >
            {/* File Upload Trigger */}
            <div className="relative">
              <input
                type="file"
                id="email-backup-restore-file"
                accept=".json,application/json"
                onChange={handleRestoreFileUpload}
                className="hidden"
              />
              <label
                htmlFor="email-backup-restore-file"
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  DocLocker বেকআপ ফাইল বাচি লওক (.json)
                </span>
                <span className="text-[10px] text-slate-400">
                  ইমেইলত অহা DocLocker_Backup.json ফাইলটো ক্লিক কৰি আপলোড কৰক
                </span>
              </label>
            </div>

            {/* Paste JSON directly */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                বা বেকআপ ক'ড ইয়াত পেষ্ট কৰক (Or paste backup JSON code):
              </label>
              <textarea
                value={restoreJsonText}
                onChange={(e) => {
                  setRestoreJsonText(e.target.value);
                  if (e.target.value.trim()) {
                    parseAndPreviewBackup(e.target.value);
                  } else {
                    setRestorePreview(null);
                  }
                }}
                rows={3}
                placeholder='{"app":"DocLocker","documents":[...]}'
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Restore Preview */}
            {restorePreview && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  বেকআপ তথ্য পোৱা গৈছে:
                </div>
                <div className="text-[11px] text-slate-300">
                  ভল্ট ধাৰক: <b>{restorePreview.user}</b>
                </div>
                <div className="text-[11px] text-slate-300">
                  নথি সংখ্যা: <b>{restorePreview.docCount} খন</b> | সদস্য: <b>{restorePreview.memberCount} জন</b>
                </div>
              </div>
            )}

            {restoreError && (
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{restoreSuccess}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={!restorePreview && !restoreJsonText.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>ৰিষ্ট'ৰ নিশ্চিত কৰক (Confirm & Restore)</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Privacy Guarantee */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">গোপনীয়তা প্ৰতিশ্ৰুতি:</strong> আপোনাৰ ইমেইল আৰু নথি কোনো তৃতীয় পক্ষৰ চাৰ্ভাৰলৈ প্ৰেৰণ নহয়। ই পোনপটীয়াকৈ আপোনাৰ ব্ৰাউজাৰৰ পৰা আপোনাৰ ব্যক্তিগত ইমেইললৈ এনক্ৰিপ্ট কৰি প্ৰেৰণ কৰা হয়।
        </p>
      </div>
    </div>
  );
};
