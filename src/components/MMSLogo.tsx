import React, { useState } from 'react';

interface MMSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'icon' | 'badge';
  className?: string;
}

export const MMSLogo: React.FC<MMSLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'full',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [badgeError, setBadgeError] = useState(false);

  const sizeMap = {
    sm: { iconPx: 40, titleClass: 'text-xs font-black tracking-tight', subClass: 'text-[8.5px]' },
    md: { iconPx: 52, titleClass: 'text-sm font-black tracking-tight', subClass: 'text-[10px]' },
    lg: { iconPx: 76, titleClass: 'text-lg font-black tracking-tight', subClass: 'text-xs' },
    xl: { iconPx: 130, titleClass: 'text-2xl font-black tracking-tight', subClass: 'text-sm' },
    '2xl': { iconPx: 180, titleClass: 'text-3xl font-black tracking-tight', subClass: 'text-base' },
  };

  const { iconPx, titleClass, subClass } = sizeMap[size] || sizeMap.md;

  // Exact user-specified logo: public/MMS-removebg-preview.png
  const iconSrc = imgError ? '/logo.png' : '/MMS-removebg-preview.png';
  const badgeSrc = badgeError ? '/logo.png' : '/MMS-removebg-preview.png';

  const RobotIcon = (
    <img
      src={iconSrc}
      alt="MMS Academy for Science & Technology"
      width={iconPx}
      height={iconPx}
      loading="eager"
      decoding="async"
      onError={() => {
        if (!imgError) setImgError(true);
      }}
      className="object-contain select-none shrink-0 drop-shadow-md"
      style={{ width: `${iconPx}px`, height: `${iconPx}px`, minWidth: `${iconPx}px` }}
      referrerPolicy="no-referrer"
    />
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{RobotIcon}</div>;
  }

  if (variant === 'badge') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <img
          src={badgeSrc}
          alt="MMS Academy for Science & Technology"
          loading="eager"
          decoding="async"
          onError={() => {
            if (!badgeError) setBadgeError(true);
          }}
          style={{ width: `${iconPx}px`, height: 'auto', maxHeight: `${iconPx * 1.2}px` }}
          className="object-contain select-none drop-shadow-xl"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Full Horizontal Layout (e.g., in Navbar)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {RobotIcon}
      <div className="leading-tight flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`text-[#16A34A] dark:text-[#BEF264] font-black tracking-tight ${titleClass}`}>
            MMS ACADEMY
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-medium text-slate-500 dark:text-white/70 tracking-wider mt-0.5 ${subClass}`}>
            for Science & Technology
          </span>
        )}
      </div>
    </div>
  );
};
