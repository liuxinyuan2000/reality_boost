'use client';

import { useState, useEffect } from 'react';

interface CurrentTheme {
  id: string;
  theme_name: string;
  theme_description: string;
  expires_at: string;
  created_at: string;
}

interface ThemeButtonProps {
  userId: string;
  onThemeChange?: (theme: CurrentTheme | null) => void;
}

export default function ThemeButton({ userId, onThemeChange }: ThemeButtonProps) {
  const [currentTheme, setCurrentTheme] = useState<CurrentTheme | null>(null);
  const [showModal, setShowModal] = useState(false);
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
        setShowModal(false);
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
        setShowModal(false);
        onThemeChange?.(null);
      }
    } catch (error) {
      console.error('取消主题失败:', error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* 导航栏按钮 */}
      <button
        onClick={() => setShowModal(true)}
        className="button-secondary text-sm py-2 px-4 flex items-center gap-2"
      >
        <span>互动主题</span>
      </button>

      {/* 模态框 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl p-6"
            style={{ 
              background: 'var(--background)',
              border: '1px solid var(--separator)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 
                className="text-lg font-bold"
                style={{ color: 'var(--foreground)' }}
              >
                互动主题
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                ×
              </button>
            </div>

            {/* 添加描述文字 */}
            <div 
              className="text-sm mb-6 text-center"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              设置线下互动时的话题方向，帮助AI生成更有针对性的共同话题
            </div>

            {currentTheme ? (
              /* 显示当前主题 */
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--separator)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm px-2 py-1 rounded" style={{ background: 'var(--primary)', color: 'white' }}>
                      当前主题
                    </span>
                  </div>
                  <div 
                    className="font-medium mb-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {currentTheme.theme_name}
                  </div>
                  {currentTheme.theme_description && (
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--foreground-secondary)' }}
                    >
                      {currentTheme.theme_description}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentTheme(null);
                      setThemeInput({ name: '', description: '' });
                    }}
                    className="button-secondary flex-1"
                  >
                    修改主题
                  </button>
                  <button
                    onClick={cancelTheme}
                    disabled={loading}
                    className="button-secondary px-4 disabled:opacity-50"
                  >
                    取消主题
                  </button>
                </div>
              </div>
            ) : (
              /* 设置新主题 */
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--foreground)' }}>
                    主题名称
                  </label>
                  <input
                    type="text"
                    placeholder="简单描述目的或心情..."
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
                    placeholder="可以详细解释上面的目的或主题"
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
                    onClick={() => setShowModal(false)}
                    className="button-secondary px-4"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 