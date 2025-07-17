"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 路由变化时启动过渡效果
    setIsNavigating(true);
    setProgress(30);

    // 快速到达50%
    const initialTimer = setTimeout(() => setProgress(50), 50);
    
    // 快速到达80%
    const midTimer = setTimeout(() => setProgress(80), 100);

    // 完成过渡
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 150);
    }, 200);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(midTimer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  return (
    <>
      {/* 顶部进度条 */}
      {isNavigating && (
        <div 
          className="fixed top-0 left-0 h-1 z-[9999] transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(90deg, var(--primary), var(--primary-light))`,
            boxShadow: '0 0 10px var(--primary)'
          }}
        />
      )}
      
      {/* 页面内容 */}
      <div 
        className={`transition-all duration-300 ease-out ${
          isNavigating ? 'opacity-95 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
      >
        {children}
      </div>
    </>
  );
} 