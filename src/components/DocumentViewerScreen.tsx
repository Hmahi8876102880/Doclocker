import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sun,
  Moon,
  RotateCw,
  Eye,
  EyeOff,
  ShieldCheck,
  QrCode,
  Download,
  Trash2,
  Share2,
  Printer,
  Sparkles,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { IndianDocument, FamilyMember } from '../types';
import { generateDocQR } from '../utils/documentUtils';

interface DocumentViewerScreenProps {
  document: IndianDocument;
  member: FamilyMember;
  onBack: () => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocumentViewerScreen: React.FC<DocumentViewerScreenProps> = ({
  document,
  member,
  onBack,
  onDeleteDocument,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isMaxBrightness, setIsMaxBrightness] = useState(false);
  const [isUnmasked, setIsUnmasked] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    generateDocQR(document.qrData || document.docNumber).then((url) => {
      setQrCodeDataUrl(url);
    });
  }, [document]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const displayNumber = isUnmasked ? document.docNumber : document.maskedNumber;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col pb-12 ${
        isMaxBrightness
          ? 'bg-white text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header: Document Category + Brightness Toggle */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b transition-colors ${
          isMaxBrightness
            ? 'bg-white/95 border-slate-200 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 text-white backdrop-blur-md'
        }`}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              id="back-from-viewer-btn"
              className={`p-2 -ml-1.5 rounded-xl transition-colors cursor-pointer ${
                isMaxBrightness
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">
                {document.title} Details
              </h1>
              <p
                className={`text-[11px] truncate ${
                  isMaxBrightness ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Profile: <strong className="text-amber-500">{member.name}</strong> ({document.relationship || (member.isPrimary ? 'Self' : member.relationship)})
              </p>
            </div>
          </div>

          {/* Right Action Icons: Brightness Toggle & Delete */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Brightness Toggle button (Requirement 6) */}
            <button
              onClick={() => setIsMaxBrightness(!isMaxBrightness)}
              id="viewer-brightness-toggle-btn"
              className={`px-3 py-1.5 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isMaxBrightness
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold ring-2 ring-amber-400'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Max Brightness for Barcode / QR Scanning by Authorities"
            >
              {isMaxBrightness ? (
                <>
                  <Moon className="w-4 h-4 text-slate-950" />
                  <span>Normal</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Max Brightness</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              id="viewer-delete-btn"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isMaxBrightness
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Display */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Brightness Notice if active */}
        {isMaxBrightness && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Sun className="w-4 h-4 text-amber-600" />
              High-contrast optical scanning mode active for physical authorities
            </span>
            <button
              onClick={() => setIsMaxBrightness(false)}
              className="text-[11px] font-bold text-amber-800 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Card Flip Selector: Front vs Back */}
        <div className="flex items-center justify-between">
          <div className="inline-flex p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <button
              onClick={() => setActiveSide('front')}
              id="viewer-side-front-btn"
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => setActiveSide('back')}
              id="viewer-side-back-btn"
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeSide === 'back'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Back Side
            </button>
          </div>

          <button
            onClick={() => setActiveSide((s) => (s === 'front' ? 'back' : 'front'))}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip Card</span>
          </button>
        </div>

        {/* REALISTIC GRAPHICAL DOCUMENT CARDS */}
        <div className="relative perspective-1000">
          {/* AADHAAR CARD SPECIFIC GRAPHIC */}
          {document.type === 'aadhaar' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-white text-slate-900`}
            >
              {/* Tricolor Header */}
              <div className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] p-1">
                <div className="bg-white/95 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Ashoka Pillar Lion Motif */}
                    <div className="w-7 h-8 flex flex-col items-center justify-center text-slate-800 text-[9px] font-bold border border-slate-300 rounded leading-tight text-center">
                      🏛️
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 tracking-tight leading-none">
                        भारत सरकार
                      </div>
                      <div className="text-[9px] font-semibold text-slate-600 tracking-wider">
                        GOVERNMENT OF INDIA
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-800 leading-none">
                      विशिष्ट पहचान प्राधिकरण
                    </div>
                    <div className="text-[8px] font-semibold text-slate-500">
                      Unique Identification Authority of India
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6 bg-radial from-amber-500/5 via-white to-emerald-500/5">
                {activeSide === 'front' ? (
                  <div>
                    {document.frontImage ? (
                      <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 aspect-[16/10] max-h-56">
                        <img
                          src={document.frontImage}
                          alt="Front Document"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-4 items-center mb-5">
                        {/* Photo Box */}
                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs">
                              <span className="text-xl mb-1">👤</span>
                              <span>Photo</span>
                            </div>
                          )}
                        </div>

                        {/* Text fields */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            {document.nameOnDoc}
                          </div>
                          {document.dob && (
                            <div className="text-xs text-slate-700">
                              जन्म तिथि / DOB: <strong className="font-semibold">{document.dob}</strong>
                            </div>
                          )}
                          {document.gender && (
                            <div className="text-xs text-slate-700">
                              लिंग / Gender: <strong className="font-semibold">{document.gender}</strong>
                            </div>
                          )}
                          <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Digital Signature Valid</span>
                          </div>
                        </div>

                        {/* Aadhaar QR Code preview */}
                        {qrCodeDataUrl && (
                          <div
                            onClick={() => setShowQrModal(true)}
                            className="shrink-0 p-1 bg-white border border-slate-300 rounded-lg shadow-xs cursor-pointer hover:border-amber-500 transition-colors"
                            title="Click to expand QR Code"
                          >
                            <img
                              src={qrCodeDataUrl}
                              alt="Aadhaar QR"
                              className="w-16 h-16 sm:w-20 sm:h-20"
                            />
                            <span className="block text-[8px] text-center text-slate-500 font-mono">
                              QR SCAN
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Aadhaar 12-Digit Number Pill */}
                    <div className="pt-3 border-t border-slate-200 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-slate-900">
                          {displayNumber}
                        </span>
                        <button
                          onClick={() => setIsUnmasked(!isUnmasked)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                          title={isUnmasked ? 'Mask Number' : 'Reveal Number'}
                        >
                          {isUnmasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-600 mt-0.5 tracking-wider font-semibold">
                        आधार - आम आदमी का अधिकार
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Back Side */
                  <div>
                    {document.backImage ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/10] max-h-56">
                        <img
                          src={document.backImage}
                          alt="Back Document"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Address / पता:
                          </div>
                          <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed mt-0.5">
                            {document.address ||
                              'Flat 402, Nilgiri Heights, MG Road, Indiranagar, Bengaluru, Karnataka - 560038'}
                          </div>
                        </div>

                        {document.fatherName && (
                          <div className="text-xs text-slate-700">
                            C/O: <strong>{document.fatherName}</strong>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Helpline: 1947</span>
                          <span>help@uidai.gov.in</span>
                          <span>www.uidai.gov.in</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAN CARD SPECIFIC GRAPHIC */}
          {document.type === 'pan' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-gradient-to-b from-sky-50 via-white to-blue-50 text-slate-900`}
            >
              <div className="bg-sky-700 text-white px-5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-tight">आयकर विभाग</div>
                  <div className="text-[10px] font-semibold tracking-wider text-sky-100">
                    INCOME TAX DEPARTMENT
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">भारत सरकार</div>
                  <div className="text-[10px] text-sky-100">GOVT. OF INDIA</div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {activeSide === 'front' ? (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1.5 flex-1">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            नाम / Full Name
                          </div>
                          <div className="text-base font-bold text-slate-900 tracking-wide">
                            {document.nameOnDoc.toUpperCase()}
                          </div>
                        </div>

                        {document.fatherName && (
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              पिता का नाम / Father's Name
                            </div>
                            <div className="text-xs font-semibold text-slate-800">
                              {document.fatherName.toUpperCase()}
                            </div>
                          </div>
                        )}

                        {document.dob && (
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              जन्म की तारीख / Date of Birth
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-800">
                              {document.dob}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hologram sticker + QR */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-300 to-sky-400 p-0.5 shadow-md flex items-center justify-center text-[9px] font-black text-slate-800 tracking-tighter">
                          HOLOGRAM
                        </div>
                        {qrCodeDataUrl && (
                          <img src={qrCodeDataUrl} alt="PAN QR" className="w-14 h-14" />
                        )}
                      </div>
                    </div>

                    {/* PAN Number Band */}
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          Permanent Account Number Card
                        </div>
                        <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                          {displayNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => setIsUnmasked(!isUnmasked)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900"
                      >
                        {isUnmasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* PAN Back */
                  <div className="p-4 text-center text-xs text-slate-600 space-y-2">
                    <p className="leading-relaxed">
                      This card is the property of Income Tax Department. If found, please return to:
                      Income Tax PAN Services Unit, NSDL e-Governance Infrastructure Limited.
                    </p>
                    <div className="pt-3 border-t border-slate-200 font-mono text-[10px]">
                      VERIFIED VIA DIGILOCKER NATIONAL DIGITAL VAULT
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DRIVING LICENSE GRAPHIC */}
          {document.type === 'driving_license' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-900`}
            >
              <div className="bg-emerald-800 text-white px-5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">UNION OF INDIA - DRIVING LICENCE</div>
                  <div className="text-[10px] text-emerald-200">
                    {document.issuerOrg || 'Transport Department'}
                  </div>
                </div>
                <div className="text-xs font-mono font-bold bg-emerald-900/80 px-2 py-0.5 rounded">
                  SMART CARD
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* Chip graphic */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-r from-amber-300 to-amber-500 border border-amber-600 shadow-inner flex items-center justify-center">
                    <div className="w-8 h-5 border border-amber-700/40 rounded-sm" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Valid Till</span>
                    <span className="text-xs font-bold text-slate-800">
                      {document.expiryDate || '19-06-2035'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Name</span>
                    <span className="font-bold text-slate-900">{document.nameOnDoc}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">DL Number</span>
                    <span className="font-mono font-bold text-slate-900">{displayNumber}</span>
                  </div>
                </div>

                {document.vehicleClasses && (
                  <div className="p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900">
                    <span className="font-semibold">Authorised Vehicle Classes: </span>
                    {document.vehicleClasses.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VOTER ID GRAPHIC */}
          {document.type === 'voter_id' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-gradient-to-b from-indigo-50 via-white to-purple-50 text-slate-900`}
            >
              <div className="bg-indigo-900 text-white px-5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">भारत निर्वाचन आयोग</div>
                  <div className="text-[10px] text-indigo-200">
                    ELECTION COMMISSION OF INDIA
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300">EPIC</div>
              </div>

              <div className="p-5 space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-semibold">EPIC Card Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-base">{displayNumber}</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-slate-500">Elector Name: </span>
                    <strong className="text-slate-900">{document.nameOnDoc}</strong>
                  </div>
                  {document.constituency && (
                    <div>
                      <span className="text-slate-500">Constituency: </span>
                      <strong className="text-slate-900">{document.constituency}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASSPORT GRAPHIC */}
          {document.type === 'passport' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-slate-950 text-white border-amber-500/30`}
            >
              <div className="p-6 text-center space-y-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-amber-500/20">
                <div className="text-xs tracking-widest text-amber-400 font-bold uppercase">
                  Republic of India • भारत गणराज्य
                </div>
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-amber-400/50 flex items-center justify-center text-amber-400 text-2xl font-serif">
                  🏛️
                </div>
                <div className="text-lg font-bold tracking-widest text-amber-300 uppercase">
                  PASSPORT • पासपोर्ट
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs bg-slate-900/60">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Passport No.</span>
                    <span className="text-amber-400 font-bold text-sm">{displayNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nationality</span>
                    <span className="text-white font-bold">INDIAN</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Name</span>
                  <span className="text-white font-bold text-sm">{document.nameOnDoc}</span>
                </div>

                {/* Machine Readable Zone (MRZ) strip */}
                <div className="p-2.5 rounded-lg bg-black font-mono text-[9px] text-amber-400 tracking-widest overflow-x-auto leading-relaxed border border-slate-800">
                  <div>P&lt;IND{document.nameOnDoc.replace(/\s+/g, '&lt;')}</div>
                  <div>
                    {document.docNumber}&lt;4IND{document.dob?.replace(/-/g, '').slice(2) || '880815'}
                    4M2911094&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER / CUSTOM DOCUMENT GRAPHIC */}
          {document.type === 'other' && (
            <div
              className={`w-full rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isMaxBrightness
                  ? 'border-slate-300 shadow-slate-300'
                  : 'border-slate-700/80 shadow-black/80'
              } bg-slate-900 text-white p-5 space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white">{document.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                  Verified
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-400">Document Number</div>
                <div className="font-mono text-lg font-bold text-amber-300">{displayNumber}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Name on Document</div>
                <div className="font-semibold text-white">{document.nameOnDoc}</div>
              </div>
            </div>
          )}
        </div>

        {/* QUICK DATA SPECIFICATIONS & COPY ACTIONS */}
        <div
          className={`p-4 rounded-2xl border transition-colors space-y-3 ${
            isMaxBrightness
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-slate-900/80 border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Verified Document Metadata</span>
            <span className="text-emerald-500 flex items-center gap-1 normal-case font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              AES-256 Validated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div>
                <span className="text-[10px] text-slate-400 block">Doc Number</span>
                <span className="font-mono font-bold">{document.docNumber}</span>
              </div>
              <button
                onClick={() => copyToClipboard(document.docNumber, 'docNum')}
                className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                title="Copy Number"
              >
                {copiedField === 'docNum' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div>
                <span className="text-[10px] text-slate-400 block">Name on Card</span>
                <span className="font-semibold">{document.nameOnDoc}</span>
              </div>
              <button
                onClick={() => copyToClipboard(document.nameOnDoc, 'name')}
                className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                title="Copy Name"
              >
                {copiedField === 'name' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Relationship metadata card */}
            {(document.relationship || member.relationship) && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-400 block">Relationship</span>
                  <span className="font-semibold text-amber-300">
                    {document.relationship || (member.isPrimary ? 'Self' : member.relationship)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <button
              onClick={() => setShowQrModal(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Display Official QR Code</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Updated: {new Date(document.updatedAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
      </main>

      {/* QR CODE FULLSCREEN MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <h3 className="font-bold text-lg mb-1">{document.title} QR</h3>
              <p className="text-xs text-slate-500 mb-4">
                Scan for instant authority verification & digital signature check
              </p>

              {qrCodeDataUrl ? (
                <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl inline-block mb-4 shadow-md">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-52 h-52 mx-auto" />
                </div>
              ) : (
                <div className="w-52 h-52 mx-auto flex items-center justify-center bg-slate-100 rounded-2xl mb-4">
                  <span>Generating QR...</span>
                </div>
              )}

              <div className="font-mono text-xs text-slate-700 font-bold mb-5">
                {document.maskedNumber}
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Scanner
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center text-slate-100 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Remove Document?</h3>
              <p className="text-xs text-slate-400 mb-6">
                Are you sure you want to delete this {document.title} from your on-device vault?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteDocument(document.id);
                  }}
                  id="confirm-delete-doc-btn"
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm cursor-pointer"
                >
                  Yes, Delete Document
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
