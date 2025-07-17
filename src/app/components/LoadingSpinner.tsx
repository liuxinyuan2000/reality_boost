"use client";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = '加载中...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-4">
        <div 
          className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-t-current animate-spin`}
          style={{ color: 'var(--primary)' }}
        />
        {size !== 'sm' && (
          <div 
            className="absolute inset-3 rounded-full border-2 border-transparent border-t-current animate-spin"
            style={{ 
              color: 'var(--primary)',
              animationDirection: 'reverse',
              animationDuration: '1s'
            }}
          />
        )}
      </div>
      
      {text && (
        <div 
          className={`text-center ${size === 'sm' ? 'text-sm' : 'text-base'}`}
          style={{ color: 'var(--foreground-secondary)' }}
        >
          {text}
        </div>
      )}
    </div>
  );
} 