import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Users,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Fingerprint,
  Lock,
  Download,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Building2,
  Globe,
  FileText,
  FileCheck,
  ExternalLink,
  Search,
  Award,
  Info,
  ShieldCheck,
  Edit3,
  Check,
  Crop,
  Settings,
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { EmailBackupSection } from './EmailBackupSection';
import { optimizeImageForCrop } from '../utils/imageOptimizer';
import { FamilyMember, SecuritySettings, IndianDocument, DocumentType } from '../types';
import { getStoredEncryptedPayload } from '../services/crypto';
import {
  ALL_INDIAN_OFFICIAL_DOCUMENTS,
  THREE_LINE_OFFICIAL_DOC_SUMMARY,
} from '../data/officialIndianDocuments';
import { AppLogo } from './AppLogo';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  primaryMember: FamilyMember;
  members: FamilyMember[];
  documents: IndianDocument[];
  securitySettings: SecuritySettings;
  onUpdateSecurity: (newSettings: Partial<SecuritySettings>) => void;
  onNavigateToAddMember: () => void;
  onDeleteMember: (memberId: string) => void;
  onLogOut: () => void;
  onTestScreenshotBlock: () => void;
  onOpenUpload?: (type?: DocumentType) => void;
  onUpdatePrimaryProfile?: (updated: Partial<FamilyMember>) => void;
  onRestoreVault?: (
    restoredMembers: FamilyMember[],
    restoredDocs: IndianDocument[],
    restoredSecurity?: SecuritySettings
  ) => void;
  initialSection?: MenuSection;
}

type MenuSection =
  | 'main'
  | 'profile'
  | 'family'
  | 'security'
  | 'email_backup'
  | 'help'
  | 'official_docs'
  | 'about_us';

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
  primaryMember,
  members,
  documents,
  securitySettings,
  onUpdateSecurity,
  onNavigateToAddMember,
  onDeleteMember,
  onLogOut,
  onTestScreenshotBlock,
  onOpenUpload,
  onUpdatePrimaryProfile,
  onRestoreVault,
  initialSection = 'main',
}) => {
  const [activeSection, setActiveSection] = useState<MenuSection>(initialSection);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection || 'main');
    }
  }, [isOpen, initialSection]);
  const [newPin, setNewPin] = useState('');
  const [pinChangeStatus, setPinChangeStatus] = useState<string | null>(null);
  const [showEncryptedRaw, setShowEncryptedRaw] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('All');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(primaryMember.name || '');
  const [editPhone, setEditPhone] = useState(primaryMember.phone || '');
  const [editEmail, setEditEmail] = useState(primaryMember.email || '');
  const [editDob, setEditDob] = useState(primaryMember.dob || '');
  const [editPhoto, setEditPhoto] = useState(primaryMember.avatarUrl || '');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Developer 3D Profile Avatar State & Photo Picker
  const [isDevCropping, setIsDevCropping] = useState(false);
  const [developerAvatar, setDeveloperAvatar] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('doclocker_developer_avatar') ||
        primaryMember.avatarUrl ||
        ''
      );
    }
    return primaryMember.avatarUrl || '';
  });
  const devPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleDevPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedUrl = await optimizeImageForCrop(file, 1600);
      if (optimizedUrl) {
        setImageToCrop(optimizedUrl);
        setIsDevCropping(true);
        setIsCropModalOpen(true);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          setImageToCrop(rawDataUrl);
          setIsDevCropping(true);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    setEditName(primaryMember.name || '');
    setEditPhone(primaryMember.phone || '');
    setEditEmail(primaryMember.email || '');
    setEditDob(primaryMember.dob || '');
    setEditPhoto(primaryMember.avatarUrl || '');
  }, [primaryMember]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Optimize & downscale high-res mobile camera images to prevent memory freeze and infinite loading
      const optimizedUrl = await optimizeImageForCrop(file, 1600);
      if (optimizedUrl) {
        setImageToCrop(optimizedUrl);
        setIsCropModalOpen(true);
      }
    } catch {
      // Fallback to direct FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          setImageToCrop(rawDataUrl);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (isDevCropping) {
      setDeveloperAvatar(croppedDataUrl);
      if (typeof window !== 'undefined') {
        localStorage.setItem('doclocker_developer_avatar', croppedDataUrl);
      }
      setIsDevCropping(false);
      return;
    }
    setEditPhoto(croppedDataUrl);
    if (!isEditingProfile) {
      onUpdatePrimaryProfile?.({ avatarUrl: croppedDataUrl });
    }
  };

  const handlePinChange = () => {
    if (newPin.length !== 4) {
      setPinChangeStatus('PIN must be 4 digits');
      return;
    }
    onUpdateSecurity({ appLockPin: newPin });
    setPinChangeStatus('PIN successfully updated!');
    setTimeout(() => {
      setPinChangeStatus(null);
      setNewPin('');
    }, 2000);
  };

  const handleExportDecryptedBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      primaryUser: primaryMember.name || 'Personal Vault User',
      members,
      documentsCount: documents.length,
      documents: documents.map((d) => ({
        ...d,
        frontImage: d.frontImage ? '[Image Attached]' : undefined,
        backImage: d.backImage ? '[Image Attached]' : undefined,
      })),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Indian_Document_Vault_Export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const storedPayload = getStoredEncryptedPayload() || '{"algorithm":"AES-256-GCM","status":"armed"}';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Slide-out Drawer from Right */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-y-0 right-0 max-w-sm w-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl z-10"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                {activeSection !== 'main' && (
                  <button
                    onClick={() => setActiveSection('main')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium mr-2 flex items-center gap-1 cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <h2 className="font-bold text-white text-base flex items-center gap-2">
                  {activeSection === 'main' && (
                    <>
                      <Settings className="w-5 h-5 text-amber-400" />
                      <span>Settings (ছেটিংছ)</span>
                    </>
                  )}
                  {activeSection === 'profile' && 'My Profile'}
                  {activeSection === 'family' && 'Manage Family'}
                  {activeSection === 'security' && 'Security & Privacy'}
                  {activeSection === 'email_backup' && 'Email Backup & Restore (ইমেইল বেকআপ)'}
                  {activeSection === 'help' && 'Help & Compliance'}
                  {activeSection === 'official_docs' && 'Indian All Official Documents'}
                  {activeSection === 'about_us' && 'About Us — MH WEB SOLUTIONS'}
                </h2>
              </div>
              <button
                onClick={onClose}
                id="close-hamburger-btn"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* SECTION: MAIN MENU */}
              {activeSection === 'main' && (
                <div className="space-y-6">
                  {/* User Mini Card */}
                  <div
                    onClick={() => setActiveSection('profile')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 flex items-center gap-3.5 cursor-pointer hover:border-amber-500/50 transition-all shadow-sm group"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg overflow-hidden shrink-0">
                      {primaryMember.avatarUrl ? (
                        <img
                          src={primaryMember.avatarUrl}
                          alt={primaryMember.name || 'User'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (primaryMember.name || 'User').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-amber-300">
                          {primaryMember.name || 'Personal Vault'}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium">
                          Primary
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {primaryMember.phone || 'No mobile linked'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Navigation List */}
                  <nav className="space-y-1.5">
                    <button
                      onClick={() => setActiveSection('profile')}
                      className="w-full p-3.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">My Profile</div>
                          <div className="text-[11px] text-slate-400">DOB, Virtual ID & personal records</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => setActiveSection('family')}
                      className="w-full p-3.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Manage Family</div>
                          <div className="text-[11px] text-slate-400">
                            {members.length} member{members.length !== 1 ? 's' : ''} linked
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => setActiveSection('security')}
                      className="w-full p-3.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Security & Privacy</div>
                          <div className="text-[11px] text-slate-400">PIN, Biometrics, AES-256, Screen Shield</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>



                    <button
                      onClick={() => setActiveSection('help')}
                      className="w-full p-3.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Help & Support</div>
                          <div className="text-[11px] text-slate-400">Legal validity & DigiLocker compliance</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    {/* About Us Navigation Button (Developer: MH WEB SOLUTIONS) */}
                    <button
                      onClick={() => setActiveSection('about_us')}
                      id="drawer-about-us-nav-btn"
                      className="w-full p-3.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left cursor-pointer group border border-slate-800/90"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <span>About Us</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                              MH WEB SOLUTIONS
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">Developer info, security architecture & credits</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </nav>
                </div>
              )}

              {/* SECTION: MY PROFILE */}
              {activeSection === 'profile' && (
                <div className="space-y-4">
                  {/* Hidden file input for photo upload */}
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="text-center py-4">
                    <div className="relative w-24 h-24 mx-auto mb-3 group">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 p-1 shadow-xl shadow-amber-500/20">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400 text-2xl font-bold overflow-hidden relative">
                          {(isEditingProfile ? editPhoto : primaryMember.avatarUrl) ? (
                            <img
                              src={isEditingProfile ? editPhoto : primaryMember.avatarUrl}
                              alt={primaryMember.name || 'User'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            (primaryMember.name || 'User').slice(0, 2).toUpperCase()
                          )}
                        </div>
                      </div>

                      {/* Camera / Upload Button directly on Avatar */}
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-slate-900 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title="ফটো সংলগ্ন কৰক / Upload Photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {primaryMember.name || 'Personal Vault'}
                    </h3>
                    <p className="text-xs text-amber-400 font-medium">Primary Vault Holder</p>
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-amber-500/40">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                        Edit Profile Details
                      </h4>

                      {/* Photo Attachment Option */}
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          Profile Photo (ইউজাৰ ফটো সংলগ্ন কৰক)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {editPhoto ? (
                              <img
                                src={editPhoto}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (editName || 'User').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => photoInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              {editPhoto ? 'ফটো সলনি কৰক' : 'ফটো সংলগ্ন কৰক'}
                            </button>
                            {editPhoto && (
                              <button
                                type="button"
                                onClick={() => {
                                  setImageToCrop(editPhoto);
                                  setIsCropModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Crop className="w-3.5 h-3.5" />
                                Crop কৰক
                              </button>
                            )}
                            {editPhoto && (
                              <button
                                type="button"
                                onClick={() => setEditPhoto('')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                আঁতৰাওক
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Mobile Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+91 Mobile number"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Your email address"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePrimaryProfile?.({
                              name: editName.trim(),
                              phone: editPhone.trim(),
                              email: editEmail.trim(),
                              dob: editDob,
                              avatarUrl: editPhoto,
                            });
                            setIsEditingProfile(false);
                          }}
                          className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-[11px] text-slate-400">Date of Birth (DOB)</div>
                            <div className="text-sm font-semibold text-slate-200">
                              {primaryMember.dob && !isNaN(new Date(primaryMember.dob).getTime())
                                ? new Date(primaryMember.dob).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : 'Not Specified'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-[11px] text-slate-400">Registered Mobile</div>
                            <div className="text-sm font-semibold font-mono text-slate-200">
                              {primaryMember.phone || 'Not Registered'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-[11px] text-slate-400">Email</div>
                            <div className="text-sm font-semibold text-slate-200">
                              {primaryMember.email || 'Not Set'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-[11px] text-slate-400">Aadhaar Virtual ID (VID)</div>
                            <div className="text-sm font-semibold font-mono text-amber-300">
                              {primaryMember.virtualId || 'Not Linked'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(true)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Profile Details
                        </button>
                        {primaryMember.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageToCrop(primaryMember.avatarUrl || '');
                              setIsCropModalOpen(true);
                            }}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="ফটো Crop কৰক"
                          >
                            <Crop className="w-3.5 h-3.5" /> Crop
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="ফটো সংলগ্ন কৰক"
                        >
                          <Camera className="w-3.5 h-3.5" /> ফটো সংলগ্ন
                        </button>
                      </div>

                      {/* Quick Email Backup Shortcut in Profile */}
                      <button
                        type="button"
                        onClick={() => setActiveSection('email_backup')}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-slate-850 to-slate-800 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-semibold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span>ইমেইললৈ বেকআপ প্ৰেৰণ কৰক (Email Backup)</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          Active
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* SECTION: MANAGE FAMILY */}
              {activeSection === 'family' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Family members can have their own isolated identity documents.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {members.map((member, idx) => {
                      const memberDocs = documents.filter((d) => d.memberId === member.id);
                      return (
                        <div
                          key={`drawer-mem-${member.id || 'mem'}-${idx}`}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0">
                              {(member.name || 'User').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-semibold text-sm text-white truncate">
                                  {member.name || 'Personal Vault User'}
                                </h4>
                                {member.isPrimary && (
                                  <span className="text-[10px] px-1 bg-amber-500/20 text-amber-300 rounded font-medium">
                                    Self
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {member.relationship} • {memberDocs.length} doc{memberDocs.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {!member.isPrimary && (
                            <button
                              onClick={() => onDeleteMember(member.id)}
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: SECURITY & PRIVACY */}
              {activeSection === 'security' && (
                <div className="space-y-5">
                  {/* Screenshot Block Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-sm font-semibold text-white">Screenshot Block</div>
                          <div className="text-[11px] text-slate-400">FLAG_SECURE system simulation</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.screenshotProtectionEnabled}
                          onChange={(e) =>
                            onUpdateSecurity({ screenshotProtectionEnabled: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <button
                      onClick={onTestScreenshotBlock}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Simulate Screenshot Capture Attempt</span>
                    </button>
                  </div>

                  {/* Change PIN */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-semibold text-white">Update 4-Digit PIN</h4>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="New 4-digit PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handlePinChange}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                    {pinChangeStatus && (
                      <p className="text-xs text-amber-300">{pinChangeStatus}</p>
                    )}
                  </div>

                  {/* Data Export */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">Data Export</div>
                        <div className="text-[11px] text-slate-400">Download decrypted JSON backup</div>
                      </div>
                      <button
                        onClick={handleExportDecryptedBackup}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                        title="Export JSON Backup"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Email Vault Backup Quick Card */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/35 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span>Email Vault Backup</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          নথিসমূহ ইমেইললৈ বেকআপ প্ৰেৰণ আৰু ৰিষ্ট'ৰ
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection('email_backup')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        বেকআপ খোলক
                      </button>
                    </div>
                  </div>

                  {/* Ciphertext Inspector */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        On-Device AES-256 Ciphertext
                      </span>
                      <button
                        onClick={() => setShowEncryptedRaw(!showEncryptedRaw)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {showEncryptedRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showEncryptedRaw ? 'Hide' : 'Inspect'}</span>
                      </button>
                    </div>
                    {showEncryptedRaw && (
                      <div className="p-2 rounded-lg bg-black/80 font-mono text-[10px] text-emerald-400 break-all max-h-32 overflow-y-auto border border-slate-800">
                        {storedPayload}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: EMAIL BACKUP & RESTORE */}
              {activeSection === 'email_backup' && (
                <EmailBackupSection
                  primaryMember={primaryMember}
                  members={members}
                  documents={documents}
                  securitySettings={securitySettings}
                  onRestoreVault={onRestoreVault}
                />
              )}

              {/* SECTION: HELP & SUPPORT */}
              {activeSection === 'help' && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-amber-400 text-sm">
                      Are documents legally valid?
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Yes. As per Rule 9A of the Information Technology (Preservation and Retention of Information by Intermediaries Providing Digital Locker Facilities) Rules, 2016, digital identity documents stored with cryptographic verification are treated on par with physical documents.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-amber-400 text-sm">
                      How does On-Device Encryption work?
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Unlike cloud drives, DocLocker stores your card data exclusively inside your device's secure sandboxed storage. Your 4-digit PIN derives a 256-bit AES key via PBKDF2 (100,000 iterations).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-amber-400 text-sm">
                      Scanner Brightness Mode
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      When opening any document in Viewer Mode, tap the "Max Brightness" icon to instantly maximize high-contrast visibility for airport CISF, traffic police, or railway TTE barcode scanners.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    Grievance Officer: grievances@indiandocument.gov.in (Digital Personal Data Protection Act compliant)
                  </div>
                </div>
              )}

              {/* SECTION: INDIAN ALL OFFICIAL DOCUMENT LIST */}
              {activeSection === 'official_docs' && (
                <div className="space-y-4">
                  {/* 3-Line Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Official Indian Documents (3-Line Summary)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                        Total {ALL_INDIAN_OFFICIAL_DOCUMENTS.length} IDs
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px] pt-1 border-t border-slate-800">
                      {THREE_LINE_OFFICIAL_DOC_SUMMARY.map((row, rIdx) => (
                        <div key={`summary-row-${row.line}-${rIdx}`} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                          <div className="text-[10px] font-bold text-amber-400">
                            Line {row.line}: {row.categoryTitle}
                          </div>
                          <div className="text-slate-300 flex flex-wrap gap-1.5">
                            {row.documents.map((doc, idx) => (
                              <span
                                key={`row-${row.line}-doc-${doc.name}-${idx}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-200 text-[10px] font-medium"
                              >
                                <span>{doc.name}</span>
                                <span className="text-slate-400 text-[9px]">({doc.authority})</span>
                                {idx < row.documents.length - 1 && <span className="text-slate-600 ml-1">•</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        placeholder="Search document name, UIDAI, PAN, Parivahan..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      {docSearch && (
                        <button
                          onClick={() => setDocSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                      {['All', 'Identity', 'Transport', 'Civil & Health', 'Education & Social'].map((cat, idx) => (
                        <button
                          key={`drawer-cat-${cat}-${idx}`}
                          onClick={() => setSelectedDocCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                            selectedDocCategory === cat
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Documents Directory Cards */}
                  <div className="space-y-2.5">
                    {ALL_INDIAN_OFFICIAL_DOCUMENTS.filter((doc) => {
                      const matchesCategory =
                        selectedDocCategory === 'All' || doc.category === selectedDocCategory;
                      const matchesSearch =
                        !docSearch ||
                        doc.name.toLowerCase().includes(docSearch.toLowerCase()) ||
                        doc.shortName.toLowerCase().includes(docSearch.toLowerCase()) ||
                        doc.authority.toLowerCase().includes(docSearch.toLowerCase()) ||
                        doc.purpose.toLowerCase().includes(docSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    }).map((doc, idx) => (
                      <div
                        key={`drawer-off-doc-${doc.id || 'doc'}-${idx}`}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-bold text-slate-100">{doc.name}</h5>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono font-medium border border-amber-500/30">
                                {doc.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-400 font-medium mt-0.5">{doc.authority}</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">{doc.purpose}</p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 flex-wrap gap-2">
                          <div>
                            <span className="text-slate-400">Format: </span>
                            <span className="font-mono text-slate-300">{doc.format}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Validity: </span>
                            <span className="text-slate-300">{doc.validity}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 gap-2">
                          <a
                            href={doc.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {onOpenUpload && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenUpload(doc.docTypeKey);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>+ Add to Vault</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: ABOUT US & DEVELOPER INFO (MH WEB SOLUTIONS) */}
              {activeSection === 'about_us' && (
                <div className="space-y-4 text-xs text-slate-300">
                  {/* Developer Brand Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                      <Building2 className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Official Developer
                      </div>
                      <h3 className="text-lg font-extrabold text-white tracking-wide">
                        MH WEB SOLUTIONS
                      </h3>
                      <p className="text-xs text-amber-400 font-medium mt-0.5">
                        Enterprise Web, Mobile & Security Architecture
                      </p>
                    </div>
                  </div>

                  {/* About MH WEB SOLUTIONS */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                      <Info className="w-4 h-4 text-amber-400" />
                      <h4>About MH WEB SOLUTIONS</h4>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-xs">
                      <strong className="text-slate-200">MH WEB SOLUTIONS</strong> is a specialized technology and web solutions studio engineered to develop high-performance, private, and citizen-centric web and progressive web applications across India.
                    </p>
                    <p className="text-slate-400 leading-relaxed text-xs">
                      The <strong className="text-amber-300">DocLocker</strong> platform was conceptualized, designed, and developed by <strong className="text-slate-200">MH WEB SOLUTIONS</strong> with a zero-compromise security architecture: 100% offline functionality, on-device AES-256 encryption, zero cloud telemetry, and total compliance with the Indian Digital Personal Data Protection (DPDP) Act.
                    </p>
                  </div>

                  {/* Hidden file input for Developer photo */}
                  <input
                    type="file"
                    ref={devPhotoInputRef}
                    onChange={handleDevPhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Developer Contact & Portfolio with Compact Circular Portrait at the top */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
                    {/* Compact 3D Circular Avatar Container */}
                    <div className="flex flex-col items-center justify-center pt-1">
                      <div className="relative group">
                        {/* 3D Ambient Volumetric Glow Behind Avatar */}
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/30 via-emerald-500/20 to-amber-500/30 blur-md opacity-70 pointer-events-none" />

                        {/* Small 3D Multi-Layered Circular Bevel & Frame */}
                        <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-amber-300 to-emerald-400 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.35)] ring-2 ring-slate-900/90 transition-all duration-300">
                          {/* Inner Bezel Shadow Ring with Metallic Edge */}
                          <div className="w-full h-full rounded-full p-[1.5px] bg-slate-950 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] overflow-hidden relative">
                            {(developerAvatar || primaryMember.avatarUrl || editPhoto) ? (
                              <img
                                src={developerAvatar || primaryMember.avatarUrl || editPhoto}
                                alt="Mahizul Hoque"
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
                                <User className="w-7 h-7 text-amber-400" />
                              </div>
                            )}

                            {/* 3D Spherical Glass Lens Glare & Specular Reflection */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-black/30 pointer-events-none" />
                            <div className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/35 blur-[0.5px] -rotate-30 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Developer Name Large & DEVELOPER Small */}
                      <div className="text-center mt-2.5">
                        <h4 className="text-xl font-black text-white tracking-wide">
                          Mahizul Hoque
                        </h4>
                        <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase mt-0.5">
                          DEVELOPER
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700/80 to-transparent my-1" />

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                        <span className="text-slate-400">Offered by:</span>
                        <span className="font-semibold text-slate-200">MH Web Solutions</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                        <span className="text-slate-400">Official Website:</span>
                        <a
                          href="https://mhwebsolutions.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sky-400 hover:underline"
                        >
                          https://mhwebsolutions.com
                        </a>
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                        <span className="text-slate-400">Engineering Support:</span>
                        <span className="font-mono text-slate-300">support@mhwebsolutions.com</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-400">Version:</span>
                        <span className="font-mono text-emerald-400 font-semibold">v2.5.0 (Offline Edition)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer: Developer Credit (MH WEB SOLUTIONS), About Us & Log Out */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">

              <button
                onClick={() => {
                  onClose();
                  onLogOut();
                }}
                id="drawer-logout-btn"
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out & Lock Vault</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}

      {/* Profile Photo Cropper Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </AnimatePresence>
  );
};
