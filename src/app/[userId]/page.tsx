"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '../AuthForm';
import { getCurrentUser, User, validateUser, clearAllUserData } from '../utils/userUtils';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import CategorySelector from '../components/CategorySelector';
import CategoryManagement from '../components/CategoryManagement';
import ChatSessionManagement from '../components/ChatSessionManagement';
import EnhancedChatInput from '../components/EnhancedChatInput';
import ThemeButton from '../components/ThemeButton';

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  category_id?: string;
  categories?: Category;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_private: boolean;
}

// AI 对话模态框组件
function ChatModal({ open, onClose, messages, onSend, sending, anchorRef, currentUserId }: {
  open: boolean;
  onClose: () => void;
  messages: { role: 'user' | 'ai', content: string }[];
  onSend: (msg: string) => void;
  sending: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  currentUserId: string;
}) {
  const [input, setInput] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // 计算模态框位置
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 280,
        left: rect.left + rect.width / 2,
      });
    }
  }, [open, anchorRef]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: position.top,
      left: position.left,
      transform: 'translate(-50%, 0)',
      zIndex: 1000,
      width: 340,
      maxWidth: '90vw',
      boxSizing: 'border-box',
    }} ref={modalRef}>
      <div 
        className="glass-effect rounded-2xl p-6 relative"
        style={{ 
          minHeight: 240,
          background: 'var(--background)',
          border: '1px solid var(--separator)',
          boxShadow: 'var(--shadow-4)'
        }}
      >
        <button 
          className="absolute top-4 right-6 text-2xl transition-colors duration-200 hover:opacity-60"
          style={{ color: 'var(--foreground-tertiary)' }}
          onClick={onClose}
        >
          ×
        </button>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2" style={{ maxHeight: 140 }}>
          {messages.length === 0 ? (
            <div 
              className="text-center mt-10"
              style={{ color: 'var(--foreground-tertiary)' }}
            >
              和 AI 聊聊你的笔记吧~
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <span 
                className={`inline-block rounded-xl px-3 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
                style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--background-secondary)',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)'
                }}
              >
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-2">
          <EnhancedChatInput
            value={input}
            onChange={setInput}
            onSend={(message) => {
              if (message.trim() && !sending) {
                onSend(message);
                setInput("");
              }
            }}
            placeholder="输入你的问题，使用@引用好友文件夹..."
            disabled={sending}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

// 新的便签组件 - 苹果风格
function NoteCard({ content, index, onEdit, onDelete }: { 
  content: string; 
  index: number; 
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="group relative transition-all duration-300 ease-out hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 2 + 1)}deg)`,
      }}
    >
      <div
        className="card p-6 min-h-[120px] min-w-[200px] max-w-[280px] relative"
        style={{
          background: 'var(--background)',
          boxShadow: isHovered ? 'var(--shadow-3)' : 'var(--shadow-2)',
        }}
      >
        <div 
          className="text-base leading-relaxed"
          style={{ 
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
      }}
    >
      {content}
        </div>
        
        {/* 操作按钮 - 只在悬停时显示 */}
        {(onEdit || onDelete) && (
          <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {onEdit && (
              <button
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs transition-colors duration-200"
                onClick={() => onEdit(content)}
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-xs transition-colors duration-200"
                onClick={onDelete}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnPage, setIsOwnPage] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  // 记笔记相关状态
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<'note' | 'ai'>('note');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const chatBtnRef = useRef<HTMLButtonElement | null>(null);
  
  // 共同话题相关状态
  const [commonTopics, setCommonTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const isRequestingTopics = useRef(false);
  const hasRequestedTopics = useRef(false);

  // 好友系统相关状态
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friends'>('none');
  const [friendsLoading, setFriendsLoading] = useState(false);

  // 定位相关状态
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 分类相关状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  // AI对话会话相关状态
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [showSessionManagement, setShowSessionManagement] = useState(false);
  const [categoryMessages, setCategoryMessages] = useState<{ [categoryId: string]: { role: 'user' | 'ai', content: string }[] }>({});

  // 自动获取定位
  useEffect(() => {
    if (!userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => setUserLocation(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // 获取当前用户
  useEffect(() => {
    const loadCurrentUser = async () => {
      const current = getCurrentUser();
      if (current) {
        // 验证用户是否在数据库中存在
        const isValid = await validateUser(current);
        
        if (!isValid) {
          // 用户不存在，清除所有数据并提示重新登录
          clearAllUserData();
          setCurrentUser(null);
          setIsOwnPage(false);
          console.log('用户数据已过期，请重新登录');
        } else {
          setCurrentUser(current);
          setIsOwnPage(current?.id === userId);
        }
      } else {
        setCurrentUser(null);
        setIsOwnPage(false);
      }
    };

    loadCurrentUser();
  }, [userId]);

  // 获取页面用户信息
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !data) {
          setShowAuth(true);
        } else {
          setUser(data);
        }
      } catch (error) {
        console.error('获取用户失败:', error);
        setShowAuth(true);
      }
        setLoading(false);
      }

    fetchUser();
  }, [userId]);

  // 获取分类
  useEffect(() => {
    if (!currentUser || !isOwnPage) return;

    async function fetchCategories() {
      try {
        console.log('主页面: 开始获取分类，currentUser:', currentUser);
        const response = await fetch(`/api/categories?userId=${currentUser!.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('主页面: 分类API响应:', data);
          setCategories(data.categories || []);
        } else {
          console.error('主页面: 分类API请求失败:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, [currentUser, isOwnPage]);

  // 获取AI对话会话
  useEffect(() => {
    if (!currentUser || !isOwnPage) return;

    async function fetchChatSessions() {
      try {
        const response = await fetch('/api/chat-sessions');
        if (response.ok) {
          const data = await response.json();
          setChatSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      }
    }

    fetchChatSessions();
  }, [currentUser, isOwnPage]);

  // 当分类改变且在AI模式时，自动加载该分类的对话历史
  useEffect(() => {
    if (mode === 'ai' && currentUser) {
      const categoryId = selectedCategoryId || 'default';
      const currentMessages = categoryMessages[categoryId] || [];
      setChatMessages(currentMessages);
      
      // 从本地存储加载历史消息
      if (typeof window !== 'undefined' && selectedCategoryId) {
        const stored = localStorage.getItem(`chatMessages_${currentUser.id}_${selectedCategoryId}`);
        if (stored) {
          try {
            const messages = JSON.parse(stored);
            setCategoryMessages(prev => ({
              ...prev,
              [selectedCategoryId]: messages
            }));
            setChatMessages(messages);
          } catch (error) {
            console.error('Error loading stored messages:', error);
          }
        }
      }
    }
  }, [selectedCategoryId, mode, currentUser, categoryMessages]);

  // 获取笔记
  useEffect(() => {
    if (!user || !currentUser) return;

    async function fetchNotes() {
        const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon,
            is_private
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
        if (!error && data) {
          setNotes(data);
        }
      }

    fetchNotes();
  }, [user, currentUser, userId]);

  // 检查好友状态
  useEffect(() => {
    if (!currentUser || !user || currentUser.id === user.id) return;

    async function checkRelationship() {
      try {
        if (!currentUser || !user) return;
        
        // 检查好友状态
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.id})`)
          .single();

        setFriendshipStatus(friendship ? 'friends' : 'none');
      } catch (error) {
        console.error('检查关系状态失败:', error);
      }
    }

    checkRelationship();
  }, [currentUser, user]);

  // 获取共同话题
  useEffect(() => {
    if (!currentUser || !user || currentUser.id === user.id || hasRequestedTopics.current || isRequestingTopics.current) return;

    async function fetchCommonTopics() {
      if (isRequestingTopics.current) return;
      
    isRequestingTopics.current = true;
      hasRequestedTopics.current = true;
    setLoadingTopics(true);

    try {
        if (!currentUser || !user) return;
        
      const response = await fetch('/api/generate-common-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            currentUserId: currentUser.id, 
            targetUserId: user.id,
            location: userLocation 
        }),
      });

      const data = await response.json();
        if (data.success && data.topics) {
          setCommonTopics(data.topics);
      }
    } catch (error) {
        console.error('获取共同话题失败:', error);
    } finally {
      setLoadingTopics(false);
      isRequestingTopics.current = false;
      }
    }

    const timer = setTimeout(fetchCommonTopics, 1000);
    return () => clearTimeout(timer);
  }, [currentUser, user, userLocation]);

  // 添加笔记
  const handleAddNote = async () => {
    if (!input.trim() || adding || !currentUser || !user) return;

    setAdding(true);
    try {
    const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: currentUser.id,
          content: input.trim(),
          category_id: selectedCategoryId,
        }])
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon,
            is_private
          )
        `)
      .single();

    if (!error && data) {
      setNotes([data, ...notes]);
      setInput("");
    }
    } catch (error) {
      console.error('添加笔记失败:', error);
    }
    setAdding(false);
  };

  // AI 对话 - 支持文件夹引用
  const handleAIChat = async (message: string, mentions: any[] = []) => {
    if (!currentUser || !user) return;

    const categoryId = selectedCategoryId || 'default';
    const currentMessages = categoryMessages[categoryId] || [];
    const newUserMessage = { role: 'user' as const, content: message };
    const updatedMessages = [...currentMessages, newUserMessage];

    // 更新本地消息
    setCategoryMessages(prev => ({
      ...prev,
      [categoryId]: updatedMessages
    }));
    setChatMessages(updatedMessages);
    setChatSending(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          message,
          categoryId: selectedCategoryId,
          messageHistory: currentMessages.slice(-10), // 发送最近10条消息作为上下文
          mentions: mentions // 添加文件夹引用
        }),
      });
      const data = await res.json();
      const aiMessage = { role: 'ai' as const, content: data.reply || 'AI 没有返回内容' };
      const finalMessages = [...updatedMessages, aiMessage];

      // 更新本地消息
      setCategoryMessages(prev => ({
        ...prev,
        [categoryId]: finalMessages
      }));
      setChatMessages(finalMessages);

      // 保存消息到本地存储（可选）
      if (typeof window !== 'undefined') {
        localStorage.setItem(`chatMessages_${currentUser.id}_${categoryId}`, JSON.stringify(finalMessages));
      }
    } catch {
      const errorMessage = { role: 'ai' as const, content: 'AI 回复失败，请重试' };
      const finalMessages = [...updatedMessages, errorMessage];
      setCategoryMessages(prev => ({
        ...prev,
        [categoryId]: finalMessages
      }));
      setChatMessages(finalMessages);
    }
    setChatSending(false);
  };

  // 添加好友
  const handleAddFriend = async () => {
    if (!currentUser || !user || friendsLoading) return;

    setFriendsLoading(true);
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          targetUserId: user.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFriendshipStatus('friends');
      }
    } catch (error) {
      console.error('添加好友失败:', error);
    }
    setFriendsLoading(false);
  };

  // 处理分类更新
  const handleCategoryUpdated = async () => {
    if (!currentUser) return;
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

  // 处理会话更新
  const handleSessionUpdated = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/chat-sessions');
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  // 处理分类切换时加载对话历史
  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
    
    // 加载该分类的对话历史
    const currentMessages = categoryMessages[categoryId || 'default'] || [];
    setChatMessages(currentMessages);
    
    // 如果本地存储有该分类的消息，也加载进来
    if (typeof window !== 'undefined' && currentUser && categoryId) {
      const stored = localStorage.getItem(`chatMessages_${currentUser.id}_${categoryId}`);
      if (stored) {
        try {
          const messages = JSON.parse(stored);
          setCategoryMessages(prev => ({
            ...prev,
            [categoryId]: messages
          }));
          setChatMessages(messages);
        } catch (error) {
          console.error('Error loading stored messages:', error);
        }
      }
    }
  };

  // 认证成功回调
  const handleAuthSuccess = (userData: User) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setUser(userData);
    setIsOwnPage(true);
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background-secondary)' }}
      >
        <LoadingSpinner size="lg" text="" />
      </div>
    );
  }

  // 显示注册/登录页面
  if (showAuth) {
    return (
      <div 
        className="min-h-screen py-8 px-4 flex flex-col items-center justify-center"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="max-w-md mx-auto text-center mb-8">
            <div className="text-4xl mb-4">🎯</div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            这个专属链接还没有主人
          </h1>
          <p 
            className="mb-4"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            快来注册成为第一个用户吧！
          </p>
          <div 
            className="p-4 rounded-xl"
            style={{ 
              background: 'var(--primary)',
              color: 'white'
            }}
          >
            <div className="text-sm">
                <strong>专属链接:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/${userId}` : `/${userId}`}
              </div>
            </div>
          </div>
          <AuthForm onAuth={handleAuthSuccess} customUserId={userId} />
      </div>
    );
  }

  // 用户不存在
  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="text-center p-8">
          <div className="text-2xl mb-4">❌</div>
          <div 
            className="mb-4"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            用户不存在
          </div>
          <Link 
            href="/" 
            className="button-primary inline-block px-6 py-3"
          >
            返回主页
          </Link>
        </div>
      </div>
    );
  }

  // 非本人页面：显示共同话题
  if (!isOwnPage) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center py-12 px-4"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="max-w-2xl w-full card p-8 animate-fade-in">
          <div className="text-center mb-8">
            <h2 
              className="text-3xl font-bold mb-4 flex items-center justify-center gap-2"
              style={{ color: 'var(--primary)' }}
            >
              ✦ Nebula Key
            </h2>
            
            {currentUser && user && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <div 
                  className="text-sm"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  {currentUser.username} & {user.username}
                </div>
                {friendshipStatus === 'friends' ? (
                  <span 
                    className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full"
                    style={{ 
                      background: 'var(--success)',
                      color: 'white'
                    }}
                  >
                    <span>👥</span>
                    已是好友
                  </span>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendsLoading}
                    className="button-primary text-sm px-4 py-1 disabled:opacity-50"
                  >
                    {friendsLoading ? '添加中...' : '添加好友'}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {loadingTopics ? (
            <div className="text-center py-16">
              <LoadingSpinner 
                size="lg" 
                text="AI正在冥思苦想中..." 
                className="animate-pulse"
              />
              <div 
                className="mt-6 text-sm animate-bounce"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                正在分析你们的内容...
              </div>
            </div>
          ) : (
            <>
              {commonTopics.length === 0 ? (
                <div className="text-center py-16">
                  <div 
                    className="text-lg mb-2"
                    style={{ color: 'var(--foreground-secondary)' }}
                  >
                    暂无共同话题
                  </div>
                  <div 
                    className="text-sm animate-pulse"
                    style={{ color: 'var(--foreground-tertiary)' }}
                  >
                    📝 快多写点笔记，让AI发现你们的有趣联系吧！
                  </div>
                </div>
              ) : (
                <ul className="space-y-6">
                  {commonTopics.map((topic, i) => (
                    <li 
                      key={i} 
                      className="p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up opacity-0"
                      style={{ 
                        background: 'var(--background-secondary)',
                        border: '1px solid var(--separator)',
                        animationDelay: `${i * 150}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {topic.title}
                        </span>
                      </div>
                      {topic.insight && (
                        <div 
                          className="text-sm mb-2 italic"
                          style={{ color: 'var(--secondary)' }}
                        >
                          {topic.insight}
                        </div>
                      )}
                      <div 
                        className="mb-1"
                        style={{ color: 'var(--foreground-secondary)' }}
                      >
                        你们可以聊聊：{topic.suggestion}
                      </div>
                      {topic.source && (
                        <div 
                          className="text-xs mt-2"
                          style={{ color: 'var(--foreground-tertiary)' }}
                        >
                          {topic.source}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // 本人页面：显示笔记界面
  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--background-secondary)' }}
    >
      {/* 顶部导航 */}
      <nav className="glass-effect sticky top-0 z-40 border-b" style={{ borderColor: 'var(--separator)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div 
                  className="text-2xl font-light"
                  style={{ color: 'var(--primary)' }}
                >
                  ✦
            </div>
                <span 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--foreground)' }}
                >
                  Nebula
                </span>
              </Link>
                </div>
            
            <div className="flex items-center gap-4">
              <ThemeButton userId={currentUser?.id || ''} />
              <Link 
                href={`/${user.id}/tags`} 
                className="button-secondary text-sm py-2 px-4"
              >
                状态
              </Link>
              <Link 
                href="/friends"
                className="button-secondary text-sm py-2 px-4"
              >
                好友
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 输入区域 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div 
            className="card p-6 transition-all duration-300"
            style={{ background: 'var(--background)' }}
          >
                         {/* 模式切换 */}
          <div className="flex items-center justify-center mb-6">
               <div 
                 className="relative flex p-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-opacity-80"
                 style={{ background: 'var(--background-secondary)' }}
              onClick={() => setMode(mode === 'ai' ? 'note' : 'ai')}
            >
              <div 
                   className={`absolute top-1 bottom-1 bg-white rounded-lg transition-all duration-300 ease-out shadow-sm ${
                     mode === 'ai' ? 'left-1 w-[88px]' : 'left-[93px] w-[88px]'
                   }`}
                   style={{ boxShadow: 'var(--shadow-1)' }}
              />
              <div
                   className={`relative z-10 px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-lg flex items-center justify-center whitespace-nowrap ${
                     mode === 'ai' ? 'text-gray-900' : 'text-gray-500'
                   }`}
                   style={{ width: '88px' }}
              >
                AI对话
              </div>
              <div
                   className={`relative z-10 px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-lg flex items-center justify-center whitespace-nowrap ${
                     mode === 'note' ? 'text-gray-900' : 'text-gray-500'
                   }`}
                   style={{ width: '88px' }}
              >
                写笔记
              </div>
               </div>
          </div>

             {/* 分类选择器 */}
             <div className="mb-4">
               <CategorySelector
                 userId={currentUser?.id || ''}
                 selectedCategoryId={selectedCategoryId}
                 isPrivate={mode === 'note' ? isPrivateNote : false}
                 onCategoryChange={mode === 'ai' ? handleCategoryChange : setSelectedCategoryId}
                 onPrivateChange={mode === 'note' ? setIsPrivateNote : () => {}}
                 onCreateCategory={() => setShowCategoryManagement(true)}
               />
             </div>

            {/* 输入框 */}
            {mode === 'ai' ? (
              <EnhancedChatInput
                value={input}
                onChange={setInput}
                onSend={(message, mentions) => {
                  handleAIChat(message, mentions);
                  setInput("");
                }}
                placeholder="向AI提问或对话..."
                disabled={chatSending}
                currentUserId={currentUser?.id || ''}
              />
            ) : (
              <div className="relative">
                <textarea
                  className="input-field w-full h-32 text-lg py-4 resize-none"
                  placeholder="写下你的想法..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                
                {/* 提交按钮 */}
                <button
                  onClick={handleAddNote}
                  disabled={adding || !input.trim()}
                  className="button-primary absolute right-3 w-12 h-12 rounded-full p-0 flex items-center justify-center disabled:opacity-50"
                  style={{ bottom: '36px' }}
                >
                  {adding ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
                
                {/* 快捷键提示 */}
                <div 
                  className="mt-2 text-xs text-center"
                  style={{ color: 'var(--foreground-tertiary)' }}
                >
                  💡 按 ⌘/Ctrl + Enter 快速记录
                </div>
              </div>
            )}

            {/* AI对话历史 */}
            {mode === 'ai' && chatMessages.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-xs text-center mb-2" style={{ color: 'var(--foreground-tertiary)' }}>
                  {selectedCategoryId 
                    ? `${categories.find(c => c.id === selectedCategoryId)?.name || '未知文件夹'} 的对话历史`
                    : '通用对话历史'
                  }
                </div>
                {chatMessages.slice(-3).map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                    <span 
                      className={`inline-block rounded-xl px-4 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      style={{
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--background-secondary)',
                        color: msg.role === 'user' ? 'white' : 'var(--foreground)'
                      }}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 便签墙 */}
        <div className="min-h-[60vh] flex flex-wrap gap-6 justify-center items-start">
          {(() => {
            const filteredNotes = selectedCategoryId 
              ? notes.filter(note => note.category_id === selectedCategoryId)
              : notes;
            
            return filteredNotes.length === 0 ? (
              <div 
                className="text-center w-full py-20"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                <div className="text-lg">
                  {selectedCategoryId ? '该文件夹下还没有笔记' : '还没有笔记哦'}
                </div>
                <div className="text-sm mt-2">开始记录你的想法吧</div>
              </div>
            ) : (
              filteredNotes.map((note, i) => (
                <NoteCard 
                  key={note.id} 
                  content={note.content} 
                  index={i}
                />
              ))
            );
          })()}
        </div>
          </div>

        {/* AI聊天模态框 */}
        <ChatModal
          open={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          onSend={handleAIChat}
          sending={chatSending}
          anchorRef={chatBtnRef}
          currentUserId={userId}
        />

      {/* 分类管理模态框 */}
      <CategoryManagement
        isOpen={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        onCategoryUpdated={handleCategoryUpdated}
        currentUserId={currentUser?.id}
      />

      {/* AI对话管理模态框 */}
      <ChatSessionManagement
        isOpen={showSessionManagement}
        onClose={() => setShowSessionManagement(false)}
        onSessionUpdated={handleSessionUpdated}
        currentUserId={currentUser?.id}
      />
    </div>
  );
} 