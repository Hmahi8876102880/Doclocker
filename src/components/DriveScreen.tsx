import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Filter,
  X,
  Calendar,
  User,
  Trash2,
  Download,
  Crop,
  Eye,
  Check,
  Tag,
  FileText,
  Camera,
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  Share2,
  Clock,
  ShieldCheck,
  FolderArchive,
  GraduationCap,
  Stethoscope,
  Receipt,
  Home as HomeIcon,
  Briefcase,
  Folder,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronRight,
} from 'lucide-react';
import { UnofficialDocument, DriveCategory, FamilyMember } from '../types';
import { INITIAL_DRIVE_DOCUMENTS } from '../data/defaultDriveData';
import { ImageCropModal } from './ImageCropModal';
import { optimizeImageForCrop } from '../utils/imageOptimizer';
import { autoCropDocument } from '../utils/documentCropper';
import { BottomNavBar } from './BottomNavBar';

interface DriveScreenProps {
  members: FamilyMember[];
  onBack: () => void;
  onHome: () => void;
  onSearch: () => void;
  onScanDocument: () => void;
  onAddMember: () => void;
  onOpenSettings?: () => void;
}

const CATEGORY_CONFIG: Record<
  DriveCategory,
  { label: string; assamese: string; icon: React.FC<{ className?: string }>; colorClass: string }
> = {
  academic: {
    label: 'Academic & Certificates',
    assamese: 'মাৰ্কশ্বীট / চাৰ্টিফিকেট',
    icon: GraduationCap,
    colorClass: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
  },
  medical: {
    label: 'Medical & Prescriptions',
    assamese: 'চিকিৎসা / প্ৰেছক্ৰিপশ্বন',
    icon: Stethoscope,
    colorClass: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
  },
  bill_receipt: {
    label: 'Bills & Receipts',
    assamese: 'বিল / ৰচিদ / ৱাৰেন্টি',
    icon: Receipt,
    colorClass: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
  property: {
    label: 'Property & Land',
    assamese: 'মাটি / ঘৰৰ নথি',
    icon: HomeIcon,
    colorClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },
  employment: {
    label: 'Work & Employment',
    assamese: 'চাকৰি / দৰমহাৰ স্লিপ',
    icon: Briefcase,
    colorClass: 'text-purple-400 bg-purple-500/15 border-purple-500/40',
  },
  personal: {
    label: 'Personal & Notes',
    assamese: 'ব্যক্তিগত ফটো / টোকা',
    icon: FileText,
    colorClass: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
  },
  other: {
    label: 'Other Records',
    assamese: 'অন্যান্য অনানুষ্ঠানিক নথি',
    icon: Folder,
    colorClass: 'text-slate-400 bg-slate-500/15 border-slate-500/40',
  },
};

const SUGGESTED_TITLES = [
  'HSLC Marksheet & Pass Certificate',
  'Higher Secondary / Degree Certificate',
  'Doctor Consultation Prescription',
  'Blood Test / Ultrasound Report',
  'Electricity / APDCL Bill Receipt',
  'Municipality / House Holding Tax',
  'Land Sale Deed / Jamabandi Copy',
  'Monthly Salary Pay Slip',
  'Vehicle Insurance Policy',
  'Gas / LPG Connection Receipt',
];

const STORAGE_KEY = 'doclocker_unofficial_drive_v1';

export const DriveScreen: React.FC<DriveScreenProps> = ({
  members,
  onBack,
  onHome,
  onSearch,
  onScanDocument,
  onAddMember,
  onOpenSettings,
}) => {
  // Drive Documents State
  const [documents, setDocuments] = useState<UnofficialDocument[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DRIVE_DOCUMENTS;
  });

  // Save changes to localStorage
  const saveDocuments = (updated: UnofficialDocument[]) => {
    setDocuments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | 'all'>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // Add Document Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DriveCategory>('academic');
  const [formMemberId, setFormMemberId] = useState(members[0]?.id || 'mem_primary');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState<string>('');

  // Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string>('');
  const [cropTargetDocId, setCropTargetDocId] = useState<string | null>(null);
  const [isAutoCropping, setIsAutoCropping] = useState(false);
  const [autoCroppedNotification, setAutoCroppedNotification] = useState(false);

  // File Upload References
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Directly trigger camera capture
  const handleTriggerCamera = () => {
    setFormPhoto('');
    setFormTitle('');
    setFormNotes('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMemberId(members[0]?.id || 'mem_primary');
    setFormCategory('academic');
    cameraInputRef.current?.click();
  };

  // Directly trigger gallery / file chooser
  const handleTriggerGallery = () => {
    setFormPhoto('');
    setFormTitle('');
    setFormNotes('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMemberId(members[0]?.id || 'mem_primary');
    setFormCategory('academic');
    galleryInputRef.current?.click();
  };

  // Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<UnofficialDocument | null>(null);
  const [viewerRotation, setViewerRotation] = useState(0);

  // Filtered list
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Member filter
      if (selectedMemberFilter !== 'all' && doc.memberId !== selectedMemberFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [documents, selectedCategory, selectedMemberFilter]);

  // Handle image upload from file or camera with Automatic Cropping
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAutoCropping(true);
      // Automatically detect edges and crop document bounds
      const result = await autoCropDocument(file);
      setFormPhoto(result.croppedUrl);
      setAutoCroppedNotification(true);
      setTimeout(() => setAutoCroppedNotification(false), 3500);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsAutoCropping(false);
      if (e.target) e.target.value = '';
    }
  };

  // Save new unofficial document
  const handleSaveNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('অনুগ্ৰহ কৰি নথিপত্ৰৰ নাম (Title) লিখক');
      return;
    }
    if (!formPhoto) {
      alert('অনুগ্ৰহ কৰি নথিপত্ৰৰ ফটো আপল’ড কৰক (Upload Photo)');
      return;
    }

    const newDoc: UnofficialDocument = {
      id: `drive_doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      memberId: formMemberId,
      title: formTitle.trim(),
      category: formCategory,
      date: formDate,
      notes: formNotes.trim(),
      photoUrl: formPhoto,
      tags: [CATEGORY_CONFIG[formCategory].label],
      fileSize: '1.2 MB',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveDocuments([newDoc, ...documents]);
    setIsAddModalOpen(false);
    // Reset form
    setFormTitle('');
    setFormNotes('');
    setFormPhoto('');
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    if (window.confirm('আপুনি এই নথিপত্ৰখন ড্ৰাইভৰ পৰা মচি পেলাব বিচাৰেনে? (Delete this document?)')) {
      const updated = documents.filter((d) => d.id !== id);
      saveDocuments(updated);
      if (viewingDoc?.id === id) {
        setViewingDoc(null);
      }
    }
  };

  // Download image
  const handleDownloadPhoto = (doc: UnofficialDocument) => {
    const link = document.createElement('a');
    link.href = doc.photoUrl;
    link.download = `${doc.title.replace(/\s+/g, '_')}_DocLocker.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-3 sm:px-4 py-3 pb-32 selection:bg-amber-500 selection:text-white">
      {/* Hidden Direct Camera & Gallery Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 4. PROMINENT & BEAUTIFULLY STYLED ADD DOCUMENT ACTION BANNER */}
      <div className="mb-5">
        <div
          onClick={handleTriggerCamera}
          id="btn-prominent-add-doc"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 p-4 sm:p-5 text-slate-950 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer group active:scale-[0.99] border-2 border-amber-300/60"
          role="button"
          tabIndex={0}
          title="কেমেৰাৰে ফটো তুলি নথি যোগ কৰক (Tap to Capture Document Photo)"
        >
          {/* Subtle Ambient Light Decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/25 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-black/40 shrink-0 group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7 stroke-[2.4]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-black text-slate-950 tracking-tight flex items-center gap-1.5">
                    <span>+ Add New Document</span>
                  </h2>
                  <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-950/15 text-slate-900 border border-slate-950/20 uppercase tracking-wide shrink-0">
                    📷 Camera
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900/95 mt-0.5">
                  ক্লিক কৰক আৰু কেমেৰাৰে পোনপটীয়াকৈ ফটো তোলক (Tap to Capture)
                </p>
                <div className="text-[11px] text-slate-800 font-semibold hidden sm:block mt-0.5">
                  ফটো লোৱাৰ লগে লগে স্বয়ংক্ৰিয়ভাৱে ক্ৰপ হ’ব আৰু নাম, গৰাকীৰ নাম সংৰক্ষণ কৰিব পাৰিব
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-950 text-amber-400 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md group-hover:bg-slate-900 transition-colors">
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">ফটো তোলক</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerGallery();
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/35 text-slate-950 font-bold border border-slate-950/20 transition-all cursor-pointer"
                title="গেলেৰীৰ পৰা ফটো বাছনি কৰক (Upload from Gallery)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DOCUMENTS GRID */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc, idx) => {
            const member = members.find((m) => m.id === doc.memberId);
            const catConf = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
            const CatIcon = catConf.icon;

            return (
              <div
                key={`drive-doc-card-${doc.id || 'doc'}-${idx}`}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850/90 transition-all shadow-md overflow-hidden flex flex-col"
              >
                {/* Image Thumbnail with Overlay */}
                <div
                  onClick={() => setViewingDoc(doc)}
                  className="relative w-full h-44 bg-slate-950 overflow-hidden cursor-pointer group-hover:brightness-105 transition-all"
                >
                  <img
                    src={doc.photoUrl}
                    alt={doc.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  {/* Category Pill Top Left */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catConf.colorClass}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catConf.label}</span>
                    </span>
                  </div>

                  {/* View Fullscreen overlay hint on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Photo</span>
                    </span>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => setViewingDoc(doc)}
                      className="font-bold text-white text-sm hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    {doc.notes && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom Meta & Action Row */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-700 shrink-0">
                        {member?.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[8px] flex items-center justify-center text-amber-300 font-bold">
                            {(member?.name || 'M').slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-300 font-medium truncate">
                        {member?.name || 'Personal'}
                      </span>
                      {doc.date && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{doc.date}</span>
                        </>
                      )}
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setCropSourceImage(doc.photoUrl);
                          setCropTargetDocId(doc.id);
                          setIsCropModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Crop / Rotate Photo"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPhoto(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Download Photo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 my-4 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <FolderArchive className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">কোনো অনানুষ্ঠানিক নথি পোৱা নগ’ল (No Documents)</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              আপোনাৰ মাৰ্কশ্বীট, মেডিকেল প্ৰেছক্ৰিপশ্বন, বিদ্যুৎ বিল, বা ঘৰৰ নথিৰ ফটো সংগ্ৰহ কৰিবলৈ বুটামত ক্লিক কৰক।
            </p>
          </div>
          <button
            onClick={handleTriggerCamera}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>+ কেমেৰাৰে প্ৰথম নথি তোলক (Capture First Document)</span>
          </button>
        </div>
      )}

      {/* 6. ADD UNOFFICIAL DOCUMENT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 relative my-auto max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      নথিৰ তথ্য যোগ কৰক (Document Details)
                    </h3>
                    <p className="text-[11px] text-slate-400">ফটোখনৰ নাম, গৰাকীৰ নাম আৰু শ্ৰেণী সংৰক্ষণ কৰক</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveNewDoc} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* 1. PHOTO UPLOAD / PREVIEW BOX */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      নথিপত্ৰৰ ফটো (Captured Document Photo) *
                    </label>
                    {formPhoto && (
                      <button
                        type="button"
                        onClick={handleTriggerCamera}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>পুনৰ তোলক (Retake)</span>
                      </button>
                    )}
                  </div>

                  {isAutoCropping ? (
                    <div className="rounded-2xl border-2 border-dashed border-amber-500/70 bg-slate-950/80 p-8 flex flex-col items-center justify-center gap-3 text-center h-52">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
                        <Crop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300">
                          স্বয়ংক্ৰিয়ভাৱে নথি ক্ৰপ কৰা হৈছে...
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Auto-detecting document boundaries & cropping cleanly
                        </div>
                      </div>
                    </div>
                  ) : formPhoto ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 h-52 group">
                      <img
                        src={formPhoto}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />

                      {/* Auto-cropped confirmation badge */}
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-emerald-500/50 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-sm">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>স্বয়ংক্ৰিয় ক্ৰপ সম্পন্ন (Auto-Cropped)</span>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCropSourceImage(formPhoto);
                            setCropTargetDocId(null);
                            setIsCropModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Crop className="w-3 h-3" />
                          <span>ক্ৰপ শুধৰাওক (Adjust)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerCamera}
                          className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                          title="পুনৰ কেমেৰাৰে তোলক (Retake Photo)"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleTriggerCamera}
                      className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl p-6 text-center bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        কেমেৰাৰে ফটো তোলক / বাছনি কৰক (Tap to Capture)
                      </div>
                      <div className="text-[11px] text-amber-400/90 font-medium">
                        ⚡ ফটো লোৱাৰ লগে লগে স্বয়ংক্ৰিয়ভাৱে নথি ক্ৰপ হ'ব (Auto-Crop Enabled)
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DOCUMENT TITLE & SUGGESTIONS */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    ফটোখনৰ নাম (Document Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="যেনে: HSLC Marksheet, Dr. Sharma Prescription..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {/* Quick Suggestion Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none">
                    <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">
                      Suggestions:
                    </span>
                    {SUGGESTED_TITLES.slice(0, 5).map((st, idx) => (
                      <button
                        key={`sug-title-${st}-${idx}`}
                        type="button"
                        onClick={() => setFormTitle(st)}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. FAMILY MEMBER / OWNER ASSIGNMENT */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    নথিৰ গৰাকীৰ নাম / পৰিয়ালৰ সদস্য (Document Owner) *
                  </label>
                  <select
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    {members.map((m, idx) => (
                      <option key={`drive-form-mem-${m.id || 'mem'}-${idx}`} value={m.id}>
                        {m.name || 'User'} ({m.isPrimary ? 'Self' : m.relationship})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. CATEGORY SELECTION */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    নথিৰ বিভাগ (Category)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CATEGORY_CONFIG) as DriveCategory[]).map((catKey, idx) => {
                      const conf = CATEGORY_CONFIG[catKey];
                      const Icon = conf.icon;
                      const isSelected = formCategory === catKey;
                      return (
                        <button
                          key={`drive-modal-cat-${catKey}-${idx}`}
                          type="button"
                          onClick={() => setFormCategory(catKey)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs truncate">{conf.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{conf.assamese}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. ISSUE / RECORD DATE */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    তাৰিখ (Document Date)
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* 6. NOTES / REMARKS */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    অধিক তথ্য / টোকা (Notes / Description)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="নথিপত্ৰখনৰ বিষয়ে চমু টোকা বা গুৰুত্বপূৰ্ণ নম্বৰ লিখক..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer active:scale-98 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ড্ৰাইভত সংৰক্ষণ কৰক (Save to Drive)</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. FULL PHOTO VIEWER MODAL */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl max-h-[95vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Viewer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">
                      {viewingDoc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-amber-300">
                        {CATEGORY_CONFIG[viewingDoc.category]?.label}
                      </span>
                      <span>•</span>
                      <span>
                        {members.find((m) => m.id === viewingDoc.memberId)?.name || 'Personal'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCropSourceImage(viewingDoc.photoUrl);
                      setCropTargetDocId(viewingDoc.id);
                      setIsCropModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 transition-colors cursor-pointer"
                    title="Crop Photo"
                  >
                    <Crop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPhoto(viewingDoc)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Download to device"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(viewingDoc.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 ml-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewer Photo Container */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[60vh] relative">
                <img
                  src={viewingDoc.photoUrl}
                  alt={viewingDoc.title}
                  style={{ transform: `rotate(${viewerRotation}deg)` }}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Rotate button */}
                <button
                  onClick={() => setViewerRotation((prev) => (prev + 90) % 360)}
                  className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate 90°</span>
                </button>
              </div>

              {/* Viewer Footer Notes */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-xs space-y-1.5">
                {viewingDoc.notes && (
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {viewingDoc.notes}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>AES-256 Offline Storage</span>
                  {viewingDoc.date && <span>Date: {viewingDoc.date}</span>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. IMAGE CROP MODAL (Universal Cropper) */}
      {isCropModalOpen && cropSourceImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={cropSourceImage}
          title="নথিপত্ৰৰ ফটো Crop কৰক (Crop Document Photo)"
          initialShape="document"
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedDataUrl) => {
            if (cropTargetDocId) {
              // Updating an existing document's photo
              const updated = documents.map((d) =>
                d.id === cropTargetDocId ? { ...d, photoUrl: croppedDataUrl, updatedAt: Date.now() } : d
              );
              saveDocuments(updated);
              if (viewingDoc && viewingDoc.id === cropTargetDocId) {
                setViewingDoc({ ...viewingDoc, photoUrl: croppedDataUrl });
              }
            } else {
              // New upload
              setFormPhoto(croppedDataUrl);
            }
            setIsCropModalOpen(false);
          }}
        />
      )}

      {/* 9. BOTTOM NAVIGATION BAR (with Drive active) */}
      <BottomNavBar
        onHome={onHome}
        onSearch={onSearch}
        onScanDocument={onScanDocument}
        onAddMember={onAddMember}
        onOpenDrive={() => {}}
        onOpenSettings={onOpenSettings}
        activeTab="drive"
      />
    </div>
  );
};
