'use client';

import { useState, useEffect } from 'react';
import { Category } from '../[userId]/page';

interface ChatSession {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  category_id?: string;
  categories?: Category;
  last_message_at: string;
  created_at: string;
}

interface ChatSessionSelectorProps {
  userId: string;
  selectedSessionId?: string;
  onSessionChange: (sessionId: string) => void;
  onCreateSession?: () => void;
  className?: string;
}

export default function ChatSessionSelector({
  userId,
  selectedSessionId,
  onSessionChange,
  onCreateSession,
  className = ''
}: ChatSessionSelectorProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // 获取用户的AI对话会话
  const fetchSessions = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/chat-sessions');
      const data = await response.json();
      
      if (data.sessions) {
        setSessions(data.sessions);
        // 如果没有选中的会话且有可用会话，自动选择第一个
        if (!selectedSessionId && data.sessions.length > 0) {
          onSessionChange(data.sessions[0].id);
        }
      }
    } catch (error) {
      console.error('获取AI对话会话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  // 监听会话更新事件
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleSessionsUpdate = () => {
      fetchSessions();
    };

    window.addEventListener('chatSessionsUpdated', handleSessionsUpdate);
    return () => {
      window.removeEventListener('chatSessionsUpdated', handleSessionsUpdate);
    };
  }, [userId]);

  const selectedSession = sessions.find(session => session.id === selectedSessionId);

  return (
    <div className={`relative ${className}`}>
      {/* 选择器按钮 */}
      <div 
        className="w-full rounded-lg border cursor-pointer transition-all duration-200 hover:bg-opacity-80"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--separator)'
        }}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1">
            {selectedSession ? (
              <>
                {/* 分类指示器 */}
                {selectedSession.categories && (
                  <div 
                    className="w-3 h-3 rounded-sm flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: selectedSession.categories.color }}
                  >
                    {selectedSession.categories.icon}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div 
                    className="font-medium truncate flex items-center gap-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {selectedSession.name}
                    {selectedSession.is_private && (
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  {selectedSession.description && (
                    <div 
                      className="text-xs truncate mt-0.5"
                      style={{ color: 'var(--foreground-secondary)' }}
                    >
                      {selectedSession.description}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-sm bg-gray-300"></div>
                <span style={{ color: 'var(--foreground-secondary)' }}>
                  选择AI对话
                </span>
              </>
            )}
          </div>
          
          <div 
            className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
            style={{ color: 'var(--foreground-tertiary)' }}
          >
            ▼
          </div>
        </div>
      </div>

      {/* 下拉菜单 */}
      {showDropdown && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border animate-fade-in max-h-80 overflow-y-auto"
          style={{
            background: 'var(--background)',
            borderColor: 'var(--separator)',
            boxShadow: 'var(--shadow-3)'
          }}
        >
          <div className="py-2">
            {/* 创建新会话选项 */}
            {onCreateSession && (
              <>
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
                  style={{
                    borderColor: 'var(--separator)',
                    color: 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => {
                    onCreateSession();
                    setShowDropdown(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">创建新对话</div>
                    <div className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                      开始新的AI对话会话
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 会话列表 */}
            {loading ? (
              <div className="px-4 py-6 text-center" style={{ color: 'var(--foreground-secondary)' }}>
                加载中...
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-4 py-6 text-center" style={{ color: 'var(--foreground-secondary)' }}>
                暂无AI对话会话
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedSessionId === session.id ? 'var(--background-secondary)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSessionId === session.id) return;
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSessionId === session.id) return;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => {
                    onSessionChange(session.id);
                    setShowDropdown(false);
                  }}
                >
                  {/* 分类指示器 */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: session.categories?.color || '#6B7280'
                    }}
                  >
                    {session.categories?.icon || '🤖'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium truncate flex items-center gap-2"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {session.name}
                      {session.is_private && (
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    {session.description && (
                      <div 
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--foreground-secondary)' }}
                      >
                        {session.description}
                      </div>
                    )}
                    {session.categories && (
                      <div 
                        className="text-xs mt-0.5"
                        style={{ color: session.categories.color }}
                      >
                        {session.categories.name}
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="text-xs flex-shrink-0"
                    style={{ color: 'var(--foreground-tertiary)' }}
                  >
                    {new Date(session.last_message_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 