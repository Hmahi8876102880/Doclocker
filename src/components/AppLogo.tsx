import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
}) => {
  // Sizing definitions for the 3D DocLocker icon
  const sizeMap = {
    xs: { box: 'w-7 h-7 rounded-lg', img: 'w-7 h-7' },
    sm: { box: 'w-9 h-9 rounded-xl', img: 'w-9 h-9' },
    md: { box: 'w-11 h-11 rounded-xl', img: 'w-11 h-11' },
    lg: { box: 'w-16 h-16 rounded-2xl', img: 'w-16 h-16' },
    xl: { box: 'w-20 h-20 rounded-3xl', img: 'w-20 h-20' },
    hero: { box: 'w-28 h-28 sm:w-32 sm:h-32 rounded-[28px]', img: 'w-28 h-28 sm:w-32 sm:h-32' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* The 3D Orange Document Locker Safe Icon */}
      <div className="relative shrink-0 group">
        <div
          className={`${currentSize.box} relative flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95`}
        >
          {/* Subtle Ambient Glow Behind Safe */}
          <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md -z-10" />

          {/* 3D Orange Safe Locker Icon Image */}
          <img
            src="/icon.svg"
            alt="DocLocker ডকলকাৰ"
            referrerPolicy="no-referrer"
            className={`${currentSize.img} object-contain drop-shadow-md select-none`}
            draggable={false}
          />
        </div>

        {/* Indian Tricolor Accent Pip */}
        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded-full shadow-md pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
        </div>
      </div>

      {/* Optional Side Branding Text */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
              DocLocker
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              ডকলকাৰ
            </span>
          </div>
          {subtitle ? (
            <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Digital Identity Vault</span>
          )}
        </div>
      )}
    </div>
  );
};
