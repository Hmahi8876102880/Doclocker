import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Smartphone,
  Crop,
  Check,
} from 'lucide-react';
import { DocumentType, FamilyMember, IndianDocument } from '../types';
import { maskDocumentNumber, formatDocInput } from '../utils/documentUtils';
import { autoCropDocument } from '../utils/documentCropper';

interface DocumentUploadScreenProps {
  onBack: () => void;
  members: FamilyMember[];
  selectedMemberId?: string;
  onSaveDocument: (doc: Omit<IndianDocument, 'id' | 'updatedAt' | 'isVerified'>) => void;
  initialType?: DocumentType;
}

const DOCUMENT_TYPES: { type: DocumentType; label: string; org: string; hint: string }[] = [
  {
    type: 'aadhaar',
    label: 'Aadhaar Card',
    org: 'Unique Identification Authority of India (UIDAI)',
    hint: '12-digit UID number (e.g. 9248 1930 8912)',
  },
  {
    type: 'pan',
    label: 'PAN Card',
    org: 'Income Tax Department, Govt of India',
    hint: '10-character alphanumeric (e.g. ABCPS9814K)',
  },
  {
    type: 'driving_license',
    label: 'Driving License',
    org: 'Transport Department, Ministry of Road Transport',
    hint: 'State code + year + serial (e.g. KA-0320150049211)',
  },
  {
    type: 'voter_id',
    label: 'Voter ID (EPIC)',
    org: 'Election Commission of India (ECI)',
    hint: '10-character EPIC number (e.g. XKJ2849102)',
  },
  {
    type: 'passport',
    label: 'Indian Passport',
    org: 'Ministry of External Affairs, Govt of India',
    hint: '8-character passport code (e.g. Z3918204)',
  },
  {
    type: 'other',
    label: 'Other Document',
    org: 'Government / Official Authority',
    hint: 'Certificate or registration identifier',
  },
];

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
  onBack,
  members,
  selectedMemberId,
  onSaveDocument,
  initialType = 'aadhaar',
}) => {
  const initialTargetMemberId =
    selectedMemberId && selectedMemberId !== 'all'
      ? selectedMemberId
      : members.find((m) => m.isPrimary)?.id || members[0]?.id || '';
  const initialMember = members.find((m) => m.id === initialTargetMemberId);

  const [docType, setDocType] = useState<DocumentType>(initialType);
  const [targetMemberId, setTargetMemberId] = useState<string>(initialTargetMemberId);
  const [relationship, setRelationship] = useState<string>(
    initialMember?.isPrimary ? 'Self' : initialMember?.relationship || 'Self'
  );
  const [customRelationship, setCustomRelationship] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [nameOnDoc, setNameOnDoc] = useState('');
  const [dob, setDob] = useState('');
  const [frontImage, setFrontImage] = useState<string | undefined>(undefined);
  const [backImage, setBackImage] = useState<string | undefined>(undefined);
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-cropping loading indicators
  const [isAutoCroppingFront, setIsAutoCroppingFront] = useState(false);
  const [isAutoCroppingBack, setIsAutoCroppingBack] = useState(false);

  // Camera capture modal state
  const [activeCameraTarget, setActiveCameraTarget] = useState<'front' | 'back' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const selectedMeta = DOCUMENT_TYPES.find((d) => d.type === docType) || DOCUMENT_TYPES[0];

  const handleDocNumberChange = (val: string) => {
    const formatted = formatDocInput(val, docType);
    setDocNumber(formatted);
    setError(null);
  };

  const handleFileChange = async (target: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'front') setIsAutoCroppingFront(true);
    else setIsAutoCroppingBack(true);

    try {
      // Automatically detect edges and crop document bounds
      const result = await autoCropDocument(file);
      if (target === 'front') setFrontImage(result.croppedUrl);
      else setBackImage(result.croppedUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (target === 'front') setFrontImage(reader.result as string);
        else setBackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      if (target === 'front') setIsAutoCroppingFront(false);
      else setIsAutoCroppingBack(false);
      if (e.target) e.target.value = '';
    }
  };

  // Launch live camera capture with WebRTC
  const startCamera = async (target: 'front' | 'back') => {
    setActiveCameraTarget(target);
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera API not accessible in this context. You can upload an image file instead.');
      }
    } catch {
      setCameraError('Camera permission not granted or device camera unavailable. Please upload a photo.');
    }
  };

  const captureFrame = async () => {
    if (videoRef.current && activeCameraTarget) {
      const target = activeCameraTarget;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        stopCamera();

        if (target === 'front') setIsAutoCroppingFront(true);
        else setIsAutoCroppingBack(true);

        try {
          // Run instant automatic document cropping on camera snapshot
          const autoResult = await autoCropDocument(dataUrl);
          if (target === 'front') setFrontImage(autoResult.croppedUrl);
          else setBackImage(autoResult.croppedUrl);
        } catch {
          if (target === 'front') setFrontImage(dataUrl);
          else setBackImage(dataUrl);
        } finally {
          if (target === 'front') setIsAutoCroppingFront(false);
          else setIsAutoCroppingBack(false);
        }
        return;
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setActiveCameraTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setError('Please enter the document number.');
      return;
    }
    if (!nameOnDoc.trim()) {
      setError('Please enter the name printed on the document.');
      return;
    }
    if (!targetMemberId) {
      setError('Please select a family profile to assign this document to.');
      return;
    }

    const masked = maskDocumentNumber(docNumber, docType);
    const finalRelationship =
      relationship === 'Other' && customRelationship.trim()
        ? customRelationship.trim()
        : relationship;

    onSaveDocument({
      memberId: targetMemberId,
      type: docType,
      title: selectedMeta.label,
      docNumber: docNumber.trim(),
      maskedNumber: masked,
      nameOnDoc: nameOnDoc.trim(),
      relationship: finalRelationship || undefined,
      dob: dob || undefined,
      fatherName: fatherName || undefined,
      address: address || undefined,
      frontImage,
      backImage,
      issuerOrg: selectedMeta.org,
      categoryTag: selectedMeta.label,
      qrData: `${docType.toUpperCase()}:${docNumber.trim()}|NAME:${nameOnDoc.trim()}|REL:${finalRelationship || 'Self'}|VERIFIED:TRUE`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            id="back-from-upload-btn"
            className="p-2 -ml-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              {selectedMeta.label} Upload
            </h1>
            <p className="text-[11px] text-slate-400">Secure On-Device AES-256 Storage</p>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 sm:p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Document Type Selector Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Document Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DOCUMENT_TYPES.map((dt, idx) => {
                const isSelected = dt.type === docType;
                return (
                  <button
                    key={`upload-dt-${dt.type}-${idx}`}
                    type="button"
                    onClick={() => {
                      setDocType(dt.type);
                      setDocNumber('');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block">{dt.label}</span>
                    <span className="text-[10px] text-slate-400 truncate mt-1">
                      {dt.type === 'aadhaar' ? '12 Digits' : dt.type === 'pan' ? '10 Chars' : 'Official'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FRONT & BACK CAPTURE / UPLOAD SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Document Images (Front & Back)
              </label>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encrypted with AES-256
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* FRONT IMAGE BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px]">
                {isAutoCroppingFront ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="text-[11px] font-medium text-amber-300">স্বয়ংক্ৰিয় নথি ক্ৰপ...</span>
                  </div>
                ) : frontImage ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden group">
                    <img
                      src={frontImage}
                      alt="Document front"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFrontImage(undefined)}
                      className="absolute top-1 right-1 p-1 bg-black/70 text-rose-400 rounded-lg hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-black/75 text-white rounded text-[10px] font-medium">
                        Front
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Auto-Cropped
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Front Side</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('front')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title="Scan with Camera"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-[10px]">Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title="Upload from Gallery"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-[10px]">Upload</span>
                      </button>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={frontInputRef}
                  onChange={(e) => handleFileChange('front', e)}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* BACK IMAGE BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px]">
                {isAutoCroppingBack ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="text-[11px] font-medium text-amber-300">স্বয়ংক্ৰিয় নথি ক্ৰপ...</span>
                  </div>
                ) : backImage ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden group">
                    <img
                      src={backImage}
                      alt="Document back"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setBackImage(undefined)}
                      className="absolute top-1 right-1 p-1 bg-black/70 text-rose-400 rounded-lg hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-black/75 text-white rounded text-[10px] font-medium">
                        Back
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Auto-Cropped
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Back Side</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('back')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title="Scan with Camera"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-[10px]">Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title="Upload from Gallery"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-[10px]">Upload</span>
                      </button>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={backInputRef}
                  onChange={(e) => handleFileChange('back', e)}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* FORM DATA FIELDS */}
          <div className="space-y-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
            {/* Assign to Profile Dropdown */}
            <div>
              <label
                htmlFor="assign-profile-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Assign to Profile <span className="text-amber-400">*</span>
              </label>
              <select
                id="assign-profile-select"
                value={targetMemberId}
                onChange={(e) => {
                  const newMemberId = e.target.value;
                  setTargetMemberId(newMemberId);
                  const found = members.find((m) => m.id === newMemberId);
                  if (found) {
                    if (found.isPrimary) {
                      setRelationship('Self');
                    } else if (found.relationship) {
                      setRelationship(found.relationship);
                    }
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-sm font-medium transition-colors cursor-pointer"
              >
                {members.map((m, idx) => (
                  <option key={`upload-mem-opt-${m.id || 'mem'}-${idx}`} value={m.id} className="bg-slate-900 text-white">
                    {m.name} ({m.isPrimary ? 'Primary User / Self' : m.relationship})
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship Option */}
            <div>
              <label
                htmlFor="doc-relationship-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Relationship <span className="text-amber-400">*</span>
              </label>
              <select
                id="doc-relationship-select"
                value={relationship}
                onChange={(e) => {
                  setRelationship(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomRelationship('');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-sm font-medium transition-colors cursor-pointer"
              >
                <option value="Self" className="bg-slate-900 text-white">Self (নিজৰ / Primary User)</option>
                <option value="Spouse" className="bg-slate-900 text-white">Spouse (পত্নী / স্বামী)</option>
                <option value="Father" className="bg-slate-900 text-white">Father (পিতৃ)</option>
                <option value="Mother" className="bg-slate-900 text-white">Mother (মাতৃ)</option>
                <option value="Son" className="bg-slate-900 text-white">Son (পুত্ৰ)</option>
                <option value="Daughter" className="bg-slate-900 text-white">Daughter (কন্যা)</option>
                <option value="Parent" className="bg-slate-900 text-white">Parent (অভিভাৱক)</option>
                <option value="Child" className="bg-slate-900 text-white">Child (সন্তান)</option>
                <option value="Brother" className="bg-slate-900 text-white">Brother (ভাই / ককাই)</option>
                <option value="Sister" className="bg-slate-900 text-white">Sister (ভনী / বাইদেউ)</option>
                <option value="Sibling" className="bg-slate-900 text-white">Sibling (ভাই-ভনী)</option>
                <option value="Grandparent" className="bg-slate-900 text-white">Grandparent (ককা / আইতা)</option>
                <option value="Other" className="bg-slate-900 text-white">Other (অন্যান্য)</option>
              </select>

              {relationship === 'Other' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    id="doc-custom-relationship-input"
                    value={customRelationship}
                    onChange={(e) => setCustomRelationship(e.target.value)}
                    placeholder="Specify relationship (e.g. Guardian, Uncle, Cousin)"
                    className="w-full py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Document Number with Masking preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="doc-number-input"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Document Number <span className="text-amber-400">*</span>
                </label>
                {docNumber && (
                  <button
                    type="button"
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showUnmasked ? 'Mask' : 'Unmask'}</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showUnmasked ? 'text' : 'text'}
                  id="doc-number-input"
                  required
                  value={docNumber}
                  onChange={(e) => handleDocNumberChange(e.target.value)}
                  placeholder={selectedMeta.hint}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-base tracking-wide focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {docNumber && (
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Privacy Masked:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {maskDocumentNumber(docNumber, docType)}
                  </span>
                </div>
              )}
            </div>

            {/* Name on Document */}
            <div>
              <label
                htmlFor="name-on-doc-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Name on Document <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                id="name-on-doc-input"
                required
                value={nameOnDoc}
                onChange={(e) => setNameOnDoc(e.target.value)}
                placeholder="Full legal name as printed on card"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* DOB & Father Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="doc-dob-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Date of Birth (DOB)
                </label>
                <input
                  type="date"
                  id="doc-dob-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label
                  htmlFor="doc-father-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Father / Spouse Name
                </label>
                <input
                  type="text"
                  id="doc-father-input"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Parent or spouse name"
                  className="w-full py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="doc-address-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Permanent Address (Optional)
              </label>
              <textarea
                id="doc-address-input"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential address as stated on the back of document"
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            id="save-and-encrypt-doc-btn"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500 hover:brightness-110 text-slate-950 font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Encrypt & Save Document (AES-256)</span>
          </button>
        </form>
      </main>

      {/* Camera Live Scanner Modal */}
      {activeCameraTarget && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4">
          <div className="w-full max-w-md flex items-center justify-between text-white py-2">
            <span className="font-bold text-sm">
              Scan Document {activeCameraTarget === 'front' ? 'Front' : 'Back'}
            </span>
            <button
              onClick={stopCamera}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder with scan guide box */}
          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/60 flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-rose-400 text-xs space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg"
                >
                  Close & Use File Upload
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Guide corners */}
                <div className="absolute inset-8 border border-white/40 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-amber-400/70 animate-pulse" />
                </div>
                {/* Auto-Crop Banner */}
                <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-slate-950/85 border border-amber-400/70 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5" /> স্বয়ংক্ৰিয় নথি ক্ৰপ সক্ৰিয় (Auto-Crop Active)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Shutter Button */}
          {!cameraError && (
            <div className="py-6 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={captureFrame}
                className="w-18 h-18 rounded-full border-4 border-white bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
                title="Capture Document Photo"
              >
                <Camera className="w-8 h-8" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
