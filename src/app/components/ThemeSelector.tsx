'use client';

import { useState, useEffect } from 'react';

interface CurrentTheme {
  id: string;
  theme_name: string;
  theme_description: string;
  expires_at: string;
  created_at: string;
}

interface ThemeSelectorProps {
  userId: string;
  onThemeChange?: (theme: CurrentTheme | null) => void;
}

export default function ThemeSelector({ userId, onThemeChange }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<CurrentTheme | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [themeInput, setThemeInput] = useState({
    name: '',
    description: ''
  });

  // 获取当前主题
  useEffect(() => {
    fetchCurrentTheme();
  }, [userId]);

  const fetchCurrentTheme = async () => {
    try {
      const response = await fetch(`/api/user-themes?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentTheme(data.currentTheme);
        onThemeChange?.(data.currentTheme);
      }
    } catch (error) {
      console.error('获取主题失败:', error);
    }
  };

  // 设置主题
  const setTheme = async () => {
    if (!themeInput.name.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          themeName: themeInput.name,
          themeDescription: themeInput.description || undefined,
          duration: 4 // 默认4小时
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentTheme(data.theme);
        setShowInput(false);
        setThemeInput({ name: '', description: '' });
        onThemeChange?.(data.theme);
      }
    } catch (error) {
      console.error('设置主题失败:', error);
    }
    setLoading(false);
  };

  // 取消主题
  const cancelTheme = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user-themes?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setCurrentTheme(null);
        onThemeChange?.(null);
      }
    } catch (error) {
      console.error('取消主题失败:', error);
    }
    setLoading(false);
  };

  // 获取剩余时间
  const getRemainingTime = () => {
    if (!currentTheme?.expires_at) return '';
    
    const now = new Date();
    const expires = new Date(currentTheme.expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return '已过期';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟后过期`;
    } else {
      return `${minutes}分钟后过期`;
    }
  };

  return (
    <div className="mb-4">
      {/* 当前主题显示 */}
      {currentTheme ? (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            background: 'var(--background-secondary)',
            border: '1px solid var(--separator)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm px-2 py-1 rounded" style={{ background: 'var(--primary)', color: 'white' }}>
                  主题
                </span>
                <span 
                  className="font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {currentTheme.theme_name}
                </span>
              </div>
              {currentTheme.theme_description && (
                <div 
                  className="text-sm mb-1"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  {currentTheme.theme_description}
                </div>
              )}
              <div 
                className="text-xs"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                {getRemainingTime()}
              </div>
            </div>
            <button
              onClick={cancelTheme}
              disabled={loading}
              className="text-sm px-3 py-1 rounded transition-colors disabled:opacity-50"
              style={{ 
                background: 'var(--background)',
                color: 'var(--foreground-secondary)',
                border: '1px solid var(--separator)'
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full p-4 rounded-lg border-2 border-dashed transition-colors text-center"
              style={{ 
                borderColor: 'var(--separator)',
                color: 'var(--foreground-secondary)'
              }}
            >
              <div className="text-lg mb-1">🎯</div>
              <div className="text-sm font-medium">设置出门主题</div>
              <div className="text-xs mt-1">影响AI生成的共同话题方向</div>
            </button>
          ) : (
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                background: 'var(--background-secondary)',
                border: '1px solid var(--separator)'
              }}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--foreground)' }}>
                    主题名称
                  </label>
                  <input
                    type="text"
                    placeholder="如：咖啡聊天、学习讨论、户外运动..."
                    value={themeInput.name}
                    onChange={(e) => setThemeInput(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--foreground)' }}>
                    描述 (可选)
                  </label>
                  <textarea
                    placeholder="简单描述这次出门的目的或心情..."
                    value={themeInput.description}
                    onChange={(e) => setThemeInput(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field w-full h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={setTheme}
                    disabled={loading || !themeInput.name.trim()}
                    className="button-primary flex-1 disabled:opacity-50"
                  >
                    {loading ? '设置中...' : '设置主题'}
                  </button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setThemeInput({ name: '', description: '' });
                    }}
                    className="px-4 py-2 rounded transition-colors"
                    style={{ 
                      background: 'var(--background)',
                      color: 'var(--foreground-secondary)',
                      border: '1px solid var(--separator)'
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 