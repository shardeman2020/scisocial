'use client';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconColor = variant === 'dark' ? '#1F2937' : '#F9FAFB';
  const accentColor = variant === 'dark' ? '#3B82F6' : '#60A5FA';

  return (
    <div className="flex items-center gap-2">
      {/* SVG Logo Icon */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Atom orbits */}
        <ellipse
          cx="20"
          cy="20"
          rx="16"
          ry="8"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
          transform="rotate(0 20 20)"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="16"
          ry="8"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
          transform="rotate(60 20 20)"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="16"
          ry="8"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
          transform="rotate(120 20 20)"
        />
        {/* Center nucleus */}
        <circle cx="20" cy="20" r="3" fill={iconColor} />
        <circle cx="20" cy="20" r="2" fill={accentColor} />
        {/* Connection nodes */}
        <circle cx="20" cy="6" r="2" fill={accentColor} />
        <circle cx="34" cy="20" r="2" fill={accentColor} />
        <circle cx="20" cy="34" r="2" fill={accentColor} />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={`font-bold ${textSizeClasses[size]} ${
            variant === 'dark' ? 'text-gray-900' : 'text-white'
          }`}
        >
          Sci<span className="text-blue-600">Social</span>
        </span>
      )}
    </div>
  );
}
