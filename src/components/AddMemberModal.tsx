import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  User,
  Heart,
  Calendar,
  Phone,
  Mail,
  Camera,
  Check,
  AlertCircle,
  Save,
  Pencil,
  Trash2,
  Users,
  Crop,
} from 'lucide-react';
import { FamilyMember, Relationship } from '../types';
import { ImageCropModal } from './ImageCropModal';
import { optimizeImageForCrop } from '../utils/imageOptimizer';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  members?: FamilyMember[];
  onUpdateMember?: (memberId: string, memberData: Partial<FamilyMember>) => void;
  onDeleteMember?: (memberId: string) => void;
  initialMemberIdToEdit?: string | null;
}

const RELATIONSHIP_OPTIONS: { value: Relationship; label: string; sub: string }[] = [
  { value: 'Spouse', label: 'Spouse', sub: 'পত্নী / স্বামী' },
  { value: 'Father', label: 'Father', sub: 'পিতৃ' },
  { value: 'Mother', label: 'Mother', sub: 'মাতৃ' },
  { value: 'Son', label: 'Son', sub: 'পুত্ৰ' },
  { value: 'Daughter', label: 'Daughter', sub: 'কন্যা' },
  { value: 'Child', label: 'Child', sub: 'সন্তান' },
  { value: 'Parent', label: 'Parent', sub: 'অভিভাৱক' },
  { value: 'Brother', label: 'Brother', sub: 'ভাই / ককাই' },
  { value: 'Sister', label: 'Sister', sub: 'ভনী / বাইদেউ' },
  { value: 'Sibling', label: 'Sibling', sub: 'ভাই-ভনী' },
  { value: 'Grandparent', label: 'Grandparent', sub: 'ককা / আইতা' },
  { value: 'Other', label: 'Other', sub: 'অন্যান্য' },
];

const AVATAR_BG_COLORS = [
  { class: 'bg-emerald-600', name: 'Emerald' },
  { class: 'bg-indigo-600', name: 'Indigo' },
  { class: 'bg-amber-600', name: 'Amber' },
  { class: 'bg-rose-600', name: 'Rose' },
  { class: 'bg-cyan-600', name: 'Cyan' },
  { class: 'bg-violet-600', name: 'Violet' },
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  members = [],
  onUpdateMember,
  onDeleteMember,
  initialMemberIdToEdit = null,
}) => {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(initialMemberIdToEdit);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('Spouse');
  const [customRelationship, setCustomRelationship] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarBg, setAvatarBg] = useState('bg-indigo-600');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialMemberIdToEdit changes or when switching members
  useEffect(() => {
    if (initialMemberIdToEdit) {
      loadMemberForEdit(initialMemberIdToEdit);
    } else {
      resetToAddMode();
    }
  }, [initialMemberIdToEdit, isOpen]);

  const loadMemberForEdit = (memberId: string) => {
    const mem = members.find((m) => m.id === memberId);
    if (!mem) return;
    setEditingMemberId(mem.id);
    setName(mem.name || '');
    const isStandardRel = RELATIONSHIP_OPTIONS.some((r) => r.value === mem.relationship);
    if (isStandardRel) {
      setRelationship(mem.relationship as Relationship);
      setCustomRelationship('');
    } else {
      setRelationship('Other');
      setCustomRelationship(mem.relationship || '');
    }
    setDob(mem.dob || '');
    setPhone(mem.phone || '');
    setEmail(mem.email || '');
    setAvatarBg(mem.avatarBg || 'bg-indigo-600');
    setPhotoUrl(mem.avatarUrl);
    setCropSourceImage(mem.avatarUrl || '');
    setError(null);
  };

  const resetToAddMode = () => {
    setEditingMemberId(null);
    setName('');
    setRelationship('Spouse');
    setCustomRelationship('');
    setDob('');
    setPhone('');
    setEmail('');
    setAvatarBg('bg-indigo-600');
    setPhotoUrl(undefined);
    setCropSourceImage('');
    setError(null);
  };

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageForCrop(file, 1400);
        setCropSourceImage(optimized);
        setIsCropModalOpen(true);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setCropSourceImage(result);
            setIsCropModalOpen(true);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleOpenCropper = () => {
    if (photoUrl) {
      setCropSourceImage(photoUrl);
      setIsCropModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the full name.');
      return;
    }

    const finalRelationship: Relationship =
      relationship === 'Other' && customRelationship.trim()
        ? (customRelationship.trim() as Relationship)
        : relationship;

    if (editingMemberId) {
      // Update existing member
      if (onUpdateMember) {
        onUpdateMember(editingMemberId, {
          name: name.trim(),
          relationship: finalRelationship,
          dob: dob || '',
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          avatarBg,
          avatarUrl: photoUrl,
        });
      }
      resetToAddMode();
      onClose();
    } else {
      // Add new member
      onAddMember({
        name: name.trim(),
        relationship: finalRelationship,
        dob: dob || '',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        avatarBg,
        avatarUrl: photoUrl,
        isPrimary: false,
      });

      resetToAddMode();
      onClose();
    }
  };

  const currentEditingMember = editingMemberId ? members.find((m) => m.id === editingMemberId) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                {editingMemberId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {editingMemberId ? 'Edit Profile (প্ৰফাইল সম্পাদনা)' : 'Add Family Member (সদস্য যোগ কৰক)'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingMemberId
                    ? `Editing profile for ${currentEditingMember?.name || 'Member'}`
                    : 'Assign & manage documents for your family'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              id="close-add-member-modal-btn"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Existing Members Selector Bar (Allows quick switching / editing of any profile) */}
          {members.length > 0 && (
            <div className="mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Select Profile to Edit or Add New
                </span>
                {editingMemberId && (
                  <button
                    type="button"
                    onClick={resetToAddMode}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    + Add New Member
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={resetToAddMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    !editingMemberId
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add New</span>
                </button>

                {members.map((mem, idx) => {
                  const isCurEditing = editingMemberId === mem.id;
                  return (
                    <button
                      key={`modal-edit-mem-${mem.id || 'mem'}-${idx}`}
                      type="button"
                      onClick={() => loadMemberForEdit(mem.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                        isCurEditing
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                        {mem.avatarUrl ? (
                          <img src={mem.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (mem.name || 'M').slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span>{mem.name || (mem.isPrimary ? 'Self' : mem.relationship)}</span>
                      {mem.isPrimary && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200">
                          Self
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Photo / Initials preview & Crop Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 rounded-2xl ${avatarBg} border-2 border-slate-700 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-inner`}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xl">{(name || 'M').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer transition-colors"
                    title="Upload profile photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Profile Photo & Avatar</span>
                    {photoUrl && (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>

                  {/* Photo Action Buttons: Crop Photo, Change, Remove */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {photoUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenCropper}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="ফটো ক্ৰপ কৰক (Crop Photo)"
                        >
                          <Crop className="w-3.5 h-3.5 text-amber-400" />
                          <span>Crop Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="ফটো সলনি কৰক (Change Photo)"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(undefined);
                            setCropSourceImage('');
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="ফটো আঁতৰাওক (Remove Photo)"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload & Crop Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Avatar Color selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 mr-1">Color:</span>
                    {AVATAR_BG_COLORS.map((col, idx) => (
                      <button
                        key={`avatar-col-${col.name}-${idx}`}
                        type="button"
                        onClick={() => setAvatarBg(col.class)}
                        className={`w-5 h-5 rounded-full ${col.class} border-2 transition-all cursor-pointer flex items-center justify-center ${
                          avatarBg === col.class
                            ? 'border-white scale-110 shadow-md'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={col.name}
                      >
                        {avatarBg === col.class && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Full Name */}
            <div>
              <label
                htmlFor="member-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="member-name-input"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Rahul Hoque"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Relationship Selection */}
            <div>
              <label
                htmlFor="member-relationship-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Relationship to You <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Heart className="w-4 h-4" />
                </div>
                <select
                  id="member-relationship-select"
                  value={relationship}
                  onChange={(e) => {
                    setRelationship(e.target.value as Relationship);
                    if (e.target.value !== 'Other') setCustomRelationship('');
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {RELATIONSHIP_OPTIONS.map((opt, idx) => (
                    <option key={`rel-opt-${opt.value}-${idx}`} value={opt.value} className="bg-slate-900 text-white">
                      {opt.label} ({opt.sub})
                    </option>
                  ))}
                </select>
              </div>

              {relationship === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    id="custom-relationship-input"
                    value={customRelationship}
                    onChange={(e) => setCustomRelationship(e.target.value)}
                    placeholder="Specify custom relationship (e.g. Guardian, Cousin)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Date of Birth & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="member-dob-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="member-dob-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="member-phone-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Phone (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="member-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              {editingMemberId && currentEditingMember && !currentEditingMember.isPrimary && onDeleteMember && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${currentEditingMember.name || 'this member'}?`)) {
                      onDeleteMember(currentEditingMember.id);
                      resetToAddMode();
                    }
                  }}
                  className="py-3 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Delete Profile"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="save-member-btn"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingMemberId ? 'Save Changes' : 'Save Member'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Photo Crop Modal for Profile Pictures */}
      {isCropModalOpen && cropSourceImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={cropSourceImage}
          title="প্ৰফাইল ফটো Crop কৰক (Crop Profile Photo)"
          initialShape="circle"
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedDataUrl) => {
            setPhotoUrl(croppedDataUrl);
            setCropSourceImage(croppedDataUrl);
            setIsCropModalOpen(false);
          }}
        />
      )}
    </AnimatePresence>
  );
};

