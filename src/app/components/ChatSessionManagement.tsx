'use client';

import { useState, useEffect, useRef } from 'react';
interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_private: boolean;
}

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

interface ChatSessionManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
  currentUserId?: string;
}

interface NewSessionData {
  name: string;
  description: string;
  category_id?: string;
  is_private: boolean;
}

export default function ChatSessionManagement({ 
  isOpen, 
  onClose, 
  onSessionUpdated,
  currentUserId 
}: ChatSessionManagementProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);
  const [newSession, setNewSession] = useState<NewSessionData>({
    name: '',
    description: '',
    category_id: undefined,
    is_private: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 获取会话列表
  const fetchSessions = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch('/api/chat-sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchSessions();
      fetchCategories();
    }
  }, [isOpen, currentUserId]);

  // 点击外部关闭模态框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // 创建新会话
  const handleCreateSession = async () => {
    if (!newSession.name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });

      if (response.ok) {
        setNewSession({ name: '', description: '', category_id: undefined, is_private: false });
        setShowCreateForm(false);
        await fetchSessions();
        onSessionUpdated();
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新会话
  const handleUpdateSession = async (session: ChatSession) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });

      if (response.ok) {
        setEditingSession(null);
        await fetchSessions();
        onSessionUpdated();
      }
    } catch (error) {
      console.error('Error updating chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个AI对话会话吗？删除后，所有对话历史将永久丢失。')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId })
      });

      if (response.ok) {
        await fetchSessions();
        onSessionUpdated();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-4 border-b" style={{ background: 'var(--background-secondary)', borderColor: 'var(--separator)' }}>
          <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>AI对话管理</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* 创建新会话按钮 */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">创建新AI对话</span>
              </div>
            </button>
          )}

          {/* 创建会话表单 */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">创建新AI对话</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 会话名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会话名称</label>
                  <input
                    type="text"
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    placeholder="如：工作助手、学习伙伴..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 会话描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会话描述</label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    placeholder="简要描述这个AI对话的用途..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 分类选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择分类</label>
                  <select
                    value={newSession.category_id || ''}
                    onChange={(e) => setNewSession({ 
                      ...newSession, 
                      category_id: e.target.value || undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">无文件夹</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 隐私设置 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">私密对话</label>
                  <button
                    onClick={() => setNewSession({ ...newSession, is_private: !newSession.is_private })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      newSession.is_private ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        newSession.is_private ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateSession}
                    disabled={!newSession.name.trim() || isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '创建中...' : '创建对话'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 会话列表 */}
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                {editingSession?.id === session.id ? (
                  /* 编辑模式 */
                  <SessionEditForm
                    session={editingSession}
                    categories={categories}
                    onSave={handleUpdateSession}
                    onCancel={() => setEditingSession(null)}
                    isLoading={isLoading}
                  />
                ) : (
                  /* 显示模式 */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* 分类指示器 */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                        style={{ 
                          backgroundColor: session.categories?.color || '#6B7280'
                        }}
                      >
                        {session.categories?.icon || '🤖'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {session.name}
                          {session.is_private && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        {session.description && (
                          <div className="text-sm text-gray-600 mt-0.5">
                            {session.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                          {session.categories && (
                            <span>文件夹：{session.categories.name}</span>
                          )}
                          <span>最后使用：{new Date(session.last_message_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingSession(session)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>还没有创建任何AI对话</p>
                <p className="text-sm mt-1">点击上方按钮创建你的第一个AI对话</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 会话编辑表单组件
function SessionEditForm({ 
  session, 
  categories,
  onSave, 
  onCancel, 
  isLoading 
}: {
  session: ChatSession;
  categories: Category[];
  onSave: (session: ChatSession) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [editData, setEditData] = useState(session);

  return (
    <div className="space-y-4">
      {/* 会话名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">会话名称</label>
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 会话描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">会话描述</label>
        <textarea
          value={editData.description || ''}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 分类选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">选择分类</label>
        <select
          value={editData.category_id || ''}
          onChange={(e) => setEditData({ 
            ...editData, 
            category_id: e.target.value || undefined 
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">无文件夹</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 隐私设置 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">私密对话</label>
        <button
          onClick={() => setEditData({ ...editData, is_private: !editData.is_private })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            editData.is_private ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              editData.is_private ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(editData)}
          disabled={!editData.name.trim() || isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '保存中...' : '保存修改'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
} 