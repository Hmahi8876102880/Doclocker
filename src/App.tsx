/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FamilyMember,
  IndianDocument,
  SecuritySettings,
  DocumentType,
} from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_DOCUMENTS,
  INITIAL_SECURITY,
} from './data/defaultData';
import {
  encryptVaultData,
  decryptVaultData,
  getStoredEncryptedPayload,
  clearVaultStorage,
} from './services/crypto';
import { AuthOtpModal } from './components/AuthOtpModal';
import { PinLockScreen } from './components/PinLockScreen';
import { TopAppBar } from './components/TopAppBar';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { HomeDashboard } from './components/HomeDashboard';
import { DocumentUploadScreen } from './components/DocumentUploadScreen';
import { DocumentViewerScreen } from './components/DocumentViewerScreen';
import { AllDocumentsScreen } from './components/AllDocumentsScreen';
import { DriveScreen } from './components/DriveScreen';
import { ScreenshotShield } from './components/ScreenshotShield';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { EmailBackupModal } from './components/EmailBackupModal';

type ScreenState =
  | 'auth'
  | 'pin_lock'
  | 'dashboard'
  | 'all_documents'
  | 'upload_doc'
  | 'view_doc'
  | 'drive';

function deduplicateMembers(list: FamilyMember[]): FamilyMember[] {
  const seen = new Set<string>();
  const out: FamilyMember[] = [];
  (list || []).forEach((m, idx) => {
    let id = m.id;
    if (!id || seen.has(id)) {
      id = `${id || 'mem'}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
    }
    seen.add(id);
    out.push({ ...m, id });
  });
  return out.length > 0 ? out : INITIAL_MEMBERS;
}

function deduplicateDocs(list: IndianDocument[]): IndianDocument[] {
  const seen = new Set<string>();
  const out: IndianDocument[] = [];
  (list || []).forEach((d, idx) => {
    let id = d.id;
    if (!id || seen.has(id)) {
      id = `${id || 'doc'}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
    }
    seen.add(id);
    out.push({ ...d, id });
  });
  return out;
}

export default function App() {
  // Vault Data State
  const [members, setMembers] = useState<FamilyMember[]>(() => deduplicateMembers(INITIAL_MEMBERS));
  const [documents, setDocuments] = useState<IndianDocument[]>(() => deduplicateDocs(INITIAL_DOCUMENTS));
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const savedPin =
      typeof window !== 'undefined'
        ? localStorage.getItem('doclocker_app_pin')
        : null;
    return savedPin ? { ...INITIAL_SECURITY, appLockPin: savedPin } : INITIAL_SECURITY;
  });
  const [primaryPhone, setPrimaryPhone] = useState('');

  // Registration & Encryption check
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('doclocker_is_registered') === 'true';
  });

  // Navigation & UI State
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('pin_lock');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('pin_lock');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialSection, setDrawerInitialSection] = useState<
    'main' | 'security' | 'family' | 'profile' | 'email_backup'
  >('main');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEmailBackupModalOpen, setIsEmailBackupModalOpen] = useState(false);
  const [activeViewingDocId, setActiveViewingDocId] = useState<string | null>(null);
  const [uploadTargetType, setUploadTargetType] = useState<DocumentType>('aadhaar');

  // Screenshot block simulation state
  const [screenshotBlockedTriggered, setScreenshotBlockedTriggered] = useState(false);

  // Check if vault payload is already encrypted locally
  const [hasEncryptedStore, setHasEncryptedStore] = useState(false);

  useEffect(() => {
    const existing = getStoredEncryptedPayload();
    if (existing) {
      setHasEncryptedStore(true);
    }
    const registered = localStorage.getItem('doclocker_is_registered') === 'true';
    if (registered) {
      setIsRegistered(true);
    }
    const savedPhone = localStorage.getItem('doclocker_registered_phone');
    if (savedPhone) {
      setPrimaryPhone(savedPhone);
    }
    const savedPin = localStorage.getItem('doclocker_app_pin');
    if (savedPin) {
      setSecurity((prev) => ({ ...prev, appLockPin: savedPin }));
    }
    // Directly open to secure PIN Lock screen
    setCurrentScreen('pin_lock');
  }, []);

  // Save changes by encrypting with on-device AES-256
  const persistVault = useCallback(
    async (
      updatedMembers: FamilyMember[],
      updatedDocs: IndianDocument[],
      updatedSec: SecuritySettings
    ) => {
      try {
        await encryptVaultData(
          {
            members: updatedMembers,
            documents: updatedDocs,
            security: updatedSec,
          },
          updatedSec.appLockPin
        );
        setHasEncryptedStore(true);
      } catch (err) {
        console.error('Vault encryption error:', err);
      }
    },
    []
  );

  // Background blur listener for auto-lock & screenshot privacy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        currentScreen !== 'auth'
      ) {
        if (security.autoLockTimeoutMinutes === 0) {
          // Immediate lock
          setCurrentScreen('pin_lock');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentScreen, security.autoLockTimeoutMinutes]);

  // Handler: Auth / OTP verification success
  const handleAuthSuccess = async (phone: string, pin: string) => {
    localStorage.setItem('doclocker_is_registered', 'true');
    localStorage.setItem('doclocker_registered_phone', phone);
    localStorage.setItem('doclocker_app_pin', pin);
    setIsRegistered(true);
    setPrimaryPhone(phone);
    const newSec = { ...security, appLockPin: pin };
    setSecurity(newSec);

    // Update primary member phone
    const updatedMembers = members.map((m) =>
      m.isPrimary ? { ...m, phone } : m
    );
    setMembers(updatedMembers);

    // Initial encryption
    await persistVault(updatedMembers, documents, newSec);
    setCurrentScreen('pin_lock');
  };

  // Handler: Unlock from PIN screen
  const handlePinUnlock = async (enteredPin?: string): Promise<boolean> => {
    const activeRealPin = security.appLockPin || localStorage.getItem('doclocker_app_pin') || '1234';
    const pinToValidate = enteredPin || activeRealPin;

    // Strict validation: If enteredPin is provided and does not match the real configured PIN, strictly reject!
    if (enteredPin && enteredPin !== activeRealPin) {
      return false;
    }

    const stored = getStoredEncryptedPayload();

    if (stored) {
      try {
        const res = await decryptVaultData<{
          members: FamilyMember[];
          documents: IndianDocument[];
          security: SecuritySettings;
        }>(stored, pinToValidate);

        if (res) {
          // Sanitize any previously cached mock profile details
          const cleanedMembers = (res.members || []).map((m) =>
            m.name === 'Rajesh Sharma'
              ? { ...m, name: '', phone: '', email: '', virtualId: '', avatarUrl: undefined }
              : m
          );
          const cleanedDocs = (res.documents || []).filter(
            (d) => d.nameOnDoc !== 'Rajesh Sharma' && d.nameOnDoc !== 'RAJESH SHARMA'
          );
          setMembers(deduplicateMembers(cleanedMembers.length > 0 ? cleanedMembers : INITIAL_MEMBERS));
          setDocuments(deduplicateDocs(cleanedDocs));
          const nextSec = res.security || security;
          setSecurity({ ...nextSec, appLockPin: pinToValidate });
          localStorage.setItem('doclocker_app_pin', pinToValidate);
          setCurrentScreen('dashboard');
          return true;
        }
      } catch {
        // If decryption with pinToValidate threw an authentication error
        // If pinToValidate strictly equals activeRealPin, safely re-encrypt vault with the real PIN to synchronize
        if (pinToValidate === activeRealPin) {
          await persistVault(members, documents, { ...security, appLockPin: pinToValidate });
          setCurrentScreen('dashboard');
          return true;
        }
        return false;
      }
    } else {
      // First run before any payload was stored
      if (pinToValidate === activeRealPin) {
        await persistVault(members, documents, { ...security, appLockPin: pinToValidate });
        setCurrentScreen('dashboard');
        return true;
      }
      return false;
    }

    return false;
  };

  // Handler: Update primary profile details
  const handleUpdatePrimaryProfile = (updated: Partial<FamilyMember>) => {
    let updatedMembers = members.map((m) =>
      m.id === primaryMember.id || m.isPrimary ? { ...m, ...updated } : m
    );
    if (!updatedMembers.some((m) => m.id === primaryMember.id || m.isPrimary)) {
      updatedMembers = [{ ...primaryMember, ...updated, isPrimary: true }, ...updatedMembers];
    }
    setMembers(updatedMembers);
    persistVault(updatedMembers, documents, security);
  };

  // Handler: Lock App Immediately
  const handleQuickLock = () => {
    setIsDrawerOpen(false);
    setCurrentScreen('pin_lock');
  };

  // Handler: Log out / Lock Vault to PIN screen
  const handleLogOut = () => {
    setIsDrawerOpen(false);
    setCurrentScreen('pin_lock');
  };

  // Handler: Delete Family Member
  const handleDeleteMember = (memberId: string) => {
    const updatedMembers = members.filter((m) => m.id !== memberId);
    const updatedDocs = documents.filter((d) => d.memberId !== memberId);
    setMembers(updatedMembers);
    setDocuments(updatedDocs);
    if (selectedMemberId === memberId) {
      setSelectedMemberId('all');
    }
    persistVault(updatedMembers, updatedDocs, security);
  };

  // Handler: Add Family Member
  const handleAddMember = (
    memberData: Omit<FamilyMember, 'id' | 'createdAt'>
  ) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `mem_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    setSelectedMemberId(newMember.id);
    persistVault(updatedMembers, documents, security);
  };

  // Handler: Update Family Member
  const handleUpdateMember = (
    memberId: string,
    memberData: Partial<FamilyMember>
  ) => {
    const updatedMembers = members.map((m) =>
      m.id === memberId ? { ...m, ...memberData } : m
    );
    setMembers(updatedMembers);
    persistVault(updatedMembers, documents, security);
  };

  // Handler: Save New Document
  const handleSaveDocument = (
    docData: Omit<IndianDocument, 'id' | 'updatedAt' | 'isVerified'>
  ) => {
    const newDoc: IndianDocument = {
      ...docData,
      id: `doc_${Date.now()}`,
      updatedAt: Date.now(),
      isVerified: true,
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);

    // Keep family member's relationship in sync if specified
    let updatedMembers = members;
    if (docData.relationship && docData.memberId) {
      updatedMembers = members.map((m) => {
        if (m.id === docData.memberId && !m.isPrimary) {
          return { ...m, relationship: docData.relationship as any };
        }
        return m;
      });
      setMembers(updatedMembers);
    }

    persistVault(updatedMembers, updated, security);
    setCurrentScreen('dashboard');
  };

  // Handler: Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    persistVault(members, updated, security);
    setActiveViewingDocId(null);
    setCurrentScreen('dashboard');
  };

  // Handler: Update Security Settings
  const handleUpdateSecurity = (newSettings: Partial<SecuritySettings>) => {
    const updated = { ...security, ...newSettings };
    if (updated.appLockPin) {
      localStorage.setItem('doclocker_app_pin', updated.appLockPin);
    }
    setSecurity(updated);
    persistVault(members, documents, updated);
  };

  // Handler: Back Navigation (for TopAppBar & Browser/System Back)
  const handleNavigationBack = useCallback(() => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }
    if (
      currentScreen === 'upload_doc' ||
      currentScreen === 'view_doc' ||
      currentScreen === 'all_documents' ||
      currentScreen === 'drive'
    ) {
      setCurrentScreen('dashboard');
    } else if (currentScreen === 'dashboard') {
      if (selectedMemberId !== 'all') {
        setSelectedMemberId('all');
      } else {
        // Root dashboard: lock app to secure PIN screen
        setCurrentScreen('pin_lock');
      }
    } else if (currentScreen === 'auth') {
      setCurrentScreen('pin_lock');
    }
  }, [isDrawerOpen, currentScreen, selectedMemberId]);

  // Support mobile hardware & browser back button
  useEffect(() => {
    const onPopState = () => {
      handleNavigationBack();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleNavigationBack]);

  // Handler: Restore Vault from Email Backup
  const handleRestoreVault = (
    restoredMembers: FamilyMember[],
    restoredDocs: IndianDocument[],
    restoredSecurity?: SecuritySettings
  ) => {
    const dedupedMembers = deduplicateMembers(restoredMembers);
    const dedupedDocs = deduplicateDocs(restoredDocs);
    setMembers(dedupedMembers);
    setDocuments(dedupedDocs);
    const sec = restoredSecurity || security;
    setSecurity(sec);
    persistVault(dedupedMembers, dedupedDocs, sec);
  };

  const primaryMember =
    members.find((m) => m.isPrimary) ||
    members[0] || {
      id: 'mem_primary',
      name: '',
      relationship: 'Self',
      dob: '',
      isPrimary: true,
      phone: primaryPhone || '',
      createdAt: Date.now(),
    };

  const activeDoc = documents.find((d) => d.id === activeViewingDocId);
  const activeDocMember = activeDoc
    ? members.find((m) => m.id === activeDoc.memberId) || primaryMember
    : primaryMember;

  // Title calculation for Top App Bar
  let topBarTitle = 'My Vault';
  let topBarSubtitle = 'AES-256 On-Device Vault';

  if (currentScreen === 'upload_doc') {
    topBarTitle = 'Upload Document';
    topBarSubtitle = 'Scan & Encrypt Locally';
  } else if (currentScreen === 'view_doc' && activeDoc) {
    topBarTitle = activeDoc.title;
    topBarSubtitle = `Holder: ${activeDocMember.name || 'Personal'}`;
  } else if (currentScreen === 'drive') {
    topBarTitle = 'DocDrive';
    topBarSubtitle = 'অনানুষ্ঠানিক নথিৰ ভঁৰাল (Unofficial Documents)';
  } else if (currentScreen === 'all_documents') {
    topBarTitle = 'All Documents';
    topBarSubtitle = `${documents.length} Vault Documents • 18 Official IDs`;
  } else if (currentScreen === 'dashboard') {
    topBarTitle = 'DocLocker';
    topBarSubtitle =
      selectedMemberId === 'all'
        ? 'All Linked Documents'
        : `${activeDocMember.name || 'Personal'}'s Documents`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Real-time Connectivity & 100% Offline Vault Status Banner */}
      <OfflineStatusBanner />

      {/* 1. LOGIN / SIGNUP FLOW (Mobile Number + OTP) */}
      {currentScreen === 'auth' && (
        <AuthOtpModal
          onSuccess={handleAuthSuccess}
          onBack={() => setCurrentScreen('pin_lock')}
          defaultPhone={primaryMember.phone?.replace(/\D/g, '').slice(-10) || ''}
          defaultPin={security.appLockPin}
        />
      )}

      {/* 2. MANDATORY APP LOCK (4-digit PIN / Biometrics) */}
      {currentScreen === 'pin_lock' && (
        <PinLockScreen
          correctPin={security.appLockPin || localStorage.getItem('doclocker_app_pin') || '1234'}
          onUnlock={handlePinUnlock}
          onResetAuth={() => setCurrentScreen('auth')}
          biometricsEnabled={security.biometricsEnabled}
          onUpdatePin={(newPin) => handleUpdateSecurity({ appLockPin: newPin })}
        />
      )}

      {/* MAIN APPLICATION SCREENS (Dashboard, Upload, Viewer, Add Member, Drive) */}
      {currentScreen !== 'auth' &&
        currentScreen !== 'pin_lock' && (
          <div className="flex-1 flex flex-col min-h-screen">
            {/* GLOBAL NAVIGATION & HEADER (Persistent Top App Bar with contextual Back Navigation) */}
            <TopAppBar
              title={topBarTitle}
              subtitle={topBarSubtitle}
              showBack={currentScreen !== 'dashboard' || selectedMemberId !== 'all'}
              onBack={handleNavigationBack}
              userName={primaryMember.name}
              userPhoto={primaryMember.avatarUrl}
              onOpenProfile={() => {
                setDrawerInitialSection('main');
                setIsDrawerOpen(true);
              }}
            />

            {/* 3. SETTINGS & DRAWER MENU (Slide-out from Right with all features) */}
            <HamburgerDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              initialSection={drawerInitialSection}
              primaryMember={primaryMember}
              members={members}
              documents={documents}
              securitySettings={security}
              onUpdateSecurity={handleUpdateSecurity}
              onUpdatePrimaryProfile={handleUpdatePrimaryProfile}
              onNavigateToAddMember={() => {
                setIsDrawerOpen(false);
                setDrawerInitialSection('family');
              }}
              onDeleteMember={handleDeleteMember}
              onLogOut={handleLogOut}
              onTestScreenshotBlock={() => setScreenshotBlockedTriggered(true)}
              onOpenUpload={(type) => {
                if (type) setUploadTargetType(type);
                setCurrentScreen('upload_doc');
              }}
              onRestoreVault={handleRestoreVault}
            />

            {/* 4. HOME DASHBOARD */}
            {currentScreen === 'dashboard' && (
              <HomeDashboard
                members={members}
                documents={documents}
                selectedMemberId={selectedMemberId}
                onSelectMember={(id) => setSelectedMemberId(id)}
                onOpenDocument={(doc) => {
                  setActiveViewingDocId(doc.id);
                  setCurrentScreen('view_doc');
                }}
                onOpenUpload={(type, targetMemberId) => {
                  if (type) setUploadTargetType(type);
                  if (targetMemberId) setSelectedMemberId(targetMemberId);
                  setCurrentScreen('upload_doc');
                }}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onHome={() => {
                  setSelectedMemberId('all');
                  setCurrentScreen('dashboard');
                }}
                onOpenDrive={() => setCurrentScreen('drive')}
                onOpenSettings={() => {
                  setDrawerInitialSection('main');
                  setIsDrawerOpen(true);
                }}
                isSettingsOpen={isDrawerOpen}
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenEmailBackup={() => setIsEmailBackupModalOpen(true)}
                onOpenAllDocuments={() => setCurrentScreen('all_documents')}
              />
            )}

            {/* 4.1 UNOFFICIAL DOCUMENTS DRIVE */}
            {currentScreen === 'drive' && (
              <DriveScreen
                members={members}
                onBack={() => setCurrentScreen('dashboard')}
                onHome={() => {
                  setSelectedMemberId('all');
                  setCurrentScreen('dashboard');
                }}
                onSearch={() => setIsSearchOpen(true)}
                onScanDocument={() => {
                  setUploadTargetType('other');
                  setCurrentScreen('upload_doc');
                }}
                onAddMember={() => {
                  setDrawerInitialSection('family');
                  setIsDrawerOpen(true);
                }}
                onOpenSettings={() => {
                  setDrawerInitialSection('main');
                  setIsDrawerOpen(true);
                }}
              />
            )}

            {/* 5. ALL DOCUMENTS FULL PAGE SCREEN */}
            {currentScreen === 'all_documents' && (
              <AllDocumentsScreen
                documents={documents}
                members={members}
                onBack={() => setCurrentScreen('dashboard')}
                onOpenDocument={(doc) => {
                  setActiveViewingDocId(doc.id);
                  setCurrentScreen('view_doc');
                }}
                onOpenUpload={(type, targetMemberId) => {
                  if (type) setUploadTargetType(type);
                  if (targetMemberId) setSelectedMemberId(targetMemberId);
                  setCurrentScreen('upload_doc');
                }}
                onHome={() => {
                  setSelectedMemberId('all');
                  setCurrentScreen('dashboard');
                }}
                onSearch={() => setIsSearchOpen(true)}
                onAddMember={() => {
                  setDrawerInitialSection('family');
                  setIsDrawerOpen(true);
                }}
                onOpenDrive={() => setCurrentScreen('drive')}
                onOpenSettings={() => {
                  setDrawerInitialSection('main');
                  setIsDrawerOpen(true);
                }}
              />
            )}

            {/* 6. DOCUMENT UPLOAD & SCAN SCREEN */}
            {currentScreen === 'upload_doc' && (
              <DocumentUploadScreen
                onBack={() => setCurrentScreen('dashboard')}
                members={members}
                selectedMemberId={selectedMemberId}
                initialType={uploadTargetType}
                onSaveDocument={handleSaveDocument}
              />
            )}

            {/* 6. DOCUMENT VIEWER SCREEN (Saved Documents & Brightness Toggle) */}
            {currentScreen === 'view_doc' && activeDoc && (
              <DocumentViewerScreen
                document={activeDoc}
                member={activeDocMember}
                onBack={() => setCurrentScreen('dashboard')}
                onDeleteDocument={handleDeleteDocument}
              />
            )}
          </div>
        )}

      {/* 7. EMAIL BACKUP MODAL */}
      <EmailBackupModal
        isOpen={isEmailBackupModalOpen}
        onClose={() => setIsEmailBackupModalOpen(false)}
        primaryMember={primaryMember}
        members={members}
        documents={documents}
        securitySettings={security}
        onRestoreVault={handleRestoreVault}
      />

      {/* 8. SCREENSHOT BLOCK SHIELD (Android/iOS FLAG_SECURE Simulation) */}
      <ScreenshotShield
        enabled={security.screenshotProtectionEnabled}
        isTriggered={screenshotBlockedTriggered}
        onDismiss={() => setScreenshotBlockedTriggered(false)}
      />
    </div>
  );
}
