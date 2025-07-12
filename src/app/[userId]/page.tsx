"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { getCurrentUser, getUserById, saveUserToStorage } from "../utils/userUtils";
import AuthForm from "../AuthForm";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  password?: string;
  created_at?: string;
}

// AI聊天模态框组件
function ChatModal({ open, onClose, messages, onSend, sending, anchorRef }: {
  open: boolean;
  onClose: () => void;
  messages: { role: 'user' | 'ai', content: string }[];
  onSend: (msg: string) => void;
  sending: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [input, setInput] = useState("");
  const [position, setPosition] = useState<{top: number, left: number, width: number}>({top: 0, left: 0, width: 0});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 320,
        left: rect.left + rect.width / 2,
        width: rect.width
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && open) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

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
      <div className="bg-[#f1f5fb] rounded-2xl shadow-lg flex flex-col p-6 relative border border-gray-200" style={{minHeight: 240, boxShadow: '0 6px 32px 0 rgba(80,80,120,0.10)'}}>
        <button className="absolute top-4 right-6 text-2xl text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2" style={{maxHeight: 140}}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">和AI聊聊你的笔记吧~</div>
          ) : messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={msg.role === 'user' ? 'inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-2' : 'inline-block bg-gray-200 text-gray-800 rounded-lg px-3 py-2'}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-black"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim() && !sending) { onSend(input); setInput(""); } }}
            placeholder="输入你的问题..."
            disabled={sending}
            style={{minWidth: 0}}
          />
          <button
            className="rounded-full bg-[#e5e4fa] px-4 py-2 text-black text-base shadow border border-[#d1d0e7] hover:bg-[#d1d0e7] transition-all disabled:opacity-60 min-w-[56px]"
            onClick={() => { if (input.trim()) { onSend(input); setInput(""); } }}
            disabled={!input.trim() || sending}
          >发送</button>
        </div>
      </div>
    </div>
  );
}

// 新增便签纸条组件
function NoteSticker({ content, index }: { content: string; index: number }) {
  // 让每条纸条有不同的旋转角度和轻微错位
  const angle = (index % 2 === 0 ? 1 : -1) * (6 + (index % 3) * 2 + Math.random() * 2); // -10~+10度
  const marginX = (index % 2 === 0 ? 1 : -1) * (8 + Math.random() * 8); // -16~+16px
  return (
    <div
      style={{
        transform: `rotate(${angle}deg)` + ` translateX(${marginX}px)`,
        background: '#f5f5f0',
        color: '#222',
        boxShadow: '0 2px 12px #0002',
        minWidth: 180,
        maxWidth: 340,
        minHeight: 38,
        padding: '12px 24px',
        borderRadius: 4,
        fontSize: 22,
        fontFamily: 'monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontWeight: 600,
        marginBottom: 24,
        marginTop: 8,
        letterSpacing: 1,
        border: 'none',
        outline: 'none',
        userSelect: 'text',
        whiteSpace: 'pre-line',
        transition: 'box-shadow .2s',
      }}
    >
      {content}
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
  // const [topicsLoading, setTopicsLoading] = useState(false);
  // const [hasRequestedTopics, setHasRequestedTopics] = useState(false);
  const isRequestingTopics = useRef(false);
  const hasRequestedTopics = useRef(false);

  // 定位相关状态
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 自动获取定位
  useEffect(() => {
    if (!userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // 获取当前登录用户
  useEffect(() => {
    const currentUserData = getCurrentUser();
    setCurrentUser(currentUserData);
  }, []);

  // 获取页面用户信息
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        const userData = await getUserById(userId);
        if (userData) {
          setUser(userData);
          // 检查是否是自己的页面
          if (currentUser && currentUser.id === userId) {
            setIsOwnPage(true);
          }
        } else {
          // 用户不存在，显示注册页面
          setShowAuth(true);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setShowAuth(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  // 获取用户笔记
  useEffect(() => {
    const fetchNotes = async () => {
      if (!userId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("id, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          setNotes(data);
        }
      } catch (error) {
        console.error('获取笔记失败:', error);
      }
    };

    fetchNotes();
  }, [userId, user]);

  // 生成共同话题
  const generateCommonTopics = async () => {
    // if (topicsLoading || hasRequestedTopics) return;
    if (!user || !currentUser || currentUser.id === user.id) return;
    if (isRequestingTopics.current) return; // 防止并发请求
    
    console.log('[DEBUG] 开始生成共同话题:', { currentUser: currentUser.id, targetUser: user.id, location: userLocation });
    isRequestingTopics.current = true;
    setLoadingTopics(true);
    // setTopicsLoading(true);
    // setHasRequestedTopics(true);
    try {
      const response = await fetch('/api/generate-common-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentUserId: currentUser.id, 
          targetUserId: user.id,
          location: userLocation // 新增
        }),
      });
      const data = await response.json();
      console.log('[DEBUG] API 响应数据:', data);
      if (data.success) {
        console.log('[DEBUG] 设置共同话题:', data.topics);
        setCommonTopics(data.topics || []);
      } else {
        console.error('生成共同话题失败:', data.error);
      }
    } catch (error) {
      console.error('生成共同话题时发生错误:', error);
    } finally {
      setLoadingTopics(false);
      isRequestingTopics.current = false;
      // setTopicsLoading(false);
    }
  };

  // 添加笔记
  const handleAdd = async () => {
    if (!input.trim() || !user || !isOwnPage) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("notes")
      .insert({ content: input, user_id: user.id })
      .select()
      .single();
    setAdding(false);
    if (!error && data) {
      setNotes([data, ...notes]);
      setInput("");
    }
  };

  // 处理注册成功
  const handleAuthSuccess = async (authUser: User) => {
    // 如果注册的用户ID与URL中的ID不匹配，更新用户ID
    if (authUser.id !== userId) {
      try {
        // 更新用户ID
        const { data, error } = await supabase
          .from("users")
          .update({ id: userId })
          .eq("id", authUser.id)
          .select()
          .single();
        
        if (!error && data) {
          // 更新localStorage中的用户信息
          saveUserToStorage(data);
          setCurrentUser(data);
          setUser(data);
          setIsOwnPage(true);
          setShowAuth(false);
        }
      } catch (error) {
        console.error('更新用户ID失败:', error);
      }
    } else {
      setCurrentUser(authUser);
      setUser(authUser);
      setIsOwnPage(true);
      setShowAuth(false);
    }
  };

  // 自动生成共同话题（仅非本机主页）
  useEffect(() => {
    if (user && currentUser && !isOwnPage && !hasRequestedTopics.current && userLocation) {
      hasRequestedTopics.current = true;
      generateCommonTopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentUser, isOwnPage, userLocation]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a5a6f6] mx-auto mb-4"></div>
          <div className="text-gray-600">正在加载用户信息...</div>
          <div className="text-sm text-gray-500 mt-2">
            用户ID: {userId}
          </div>
        </div>
      </div>
    );
  }

  // 显示注册/登录页面
  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#f1f5fb] py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Nebula</h1>
            <p className="text-gray-600 mb-4">
              这个专属链接还没有主人，快来注册成为第一个用户吧！
            </p>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>专属链接:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/${userId}` : `/${userId}`}
              </div>
            </div>
          </div>
          <AuthForm onAuth={handleAuthSuccess} customUserId={userId} />
        </div>
      </div>
    );
  }

  // 用户不存在
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
        <div className="text-center p-8">
          <div className="text-2xl text-gray-600 mb-4">❌</div>
          <div className="text-gray-600 mb-4">用户不存在</div>
          <Link 
            href="/" 
            className="inline-block bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-6 py-3 transition-all"
          >
            返回主页
          </Link>
        </div>
      </div>
    );
  }

  // 显示用户笔记页面
  if (!isOwnPage) {
    // 非本机主页：只展示共同话题
    const emojiList = ['🧩', '🌍', '🤖', '💡', '🎮', '🎤', '🍔', '🏞️', '🎨', '📚'];
    return (
      <div className="min-h-screen bg-[#f1f5fb] flex flex-col items-center justify-center py-12">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg p-10">
          <h2 className="text-3xl font-extrabold text-[#6c4cff] mb-8 text-center flex items-center justify-center gap-2">
            Nebula为你们生成的超有趣共同话题
          </h2>
          {loadingTopics ? (
            <div className="text-center text-gray-500 py-12 text-lg">AI正在冥思苦想中...</div>
          ) : (
            <>
              {commonTopics.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无共同话题，快多写点笔记试试吧！</div>
              ) : (
                <ul className="space-y-7">
                  {commonTopics.map((topic, i) => (
                    <li key={i} className="bg-[#f8f7ff] rounded-2xl p-6 shadow border border-[#ececff] flex flex-col gap-2 hover:scale-[1.03] transition-transform">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{emojiList[i % emojiList.length]}</span>
                        <span className="text-lg font-bold text-[#3a2e6c]">{topic.title}</span>
                      </div>
                      {topic.insight && (
                        <div className="text-sm text-purple-600 mb-2 italic">💡 {topic.insight}</div>
                      )}
                      <div className="text-gray-700 mb-1">你们可以聊聊：{topic.suggestion}</div>
                      {topic.source && (
                        <div className="text-xs text-gray-500 mt-2">{topic.source}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-center text-purple-600 mt-10 text-lg font-semibold animate-bounce">
                别害羞，快和对方聊聊这些话题吧！🎉
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 显示用户笔记页面
  return (
    <div className="min-h-screen bg-[#f1f5fb] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {user.username} 的主页
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* {currentUser && (
                <div className="text-sm text-gray-500">
                  当前用户: {currentUser.username}
                </div>
              )} */}
              {/* <Link 
                href="/" 
                className="bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-4 py-2 transition-all"
              >
                返回主页
              </Link> */}
              <Link 
                href={`/${user.id}/tags`} 
                className="bg-[#7c7cf7] hover:bg-[#a5a6f6] text-white font-semibold rounded-lg px-4 py-2 transition-all"
              >
                状态
              </Link>
            </div>
          </div>
          
          {/* 用户专属URL
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          </div> */}
        </div>

        {/* Tab切换 */}
        {/* <div className="flex mb-2 rounded-lg overflow-hidden border border-[#e6e6fa] bg-white shadow-sm max-w-4xl w-full mx-auto">
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${mode === 'note' ? 'bg-[#a5a6f6] text-white' : 'bg-white text-[#3a2e6c]'}`}
            onClick={() => setMode('note')}
          >
            写笔记
          </button>
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${mode === 'ai' ? 'bg-[#a5a6f6] text-white' : 'bg-white text-[#3a2e6c]'}`}
            onClick={() => setMode('ai')}
          >
            AI对话
          </button>
        </div> */}
        {/* 输入区 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 max-w-4xl w-full mx-auto backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          {/* Toggle按钮：输入区上方 - 整个区域可点击的toggle */}
          <div className="flex items-center justify-center mb-6">
            <button
              className="relative bg-gray-100 rounded-full p-1 flex cursor-pointer hover:bg-gray-200 transition-all duration-300"
              onClick={() => setMode(mode === 'ai' ? 'note' : 'ai')}
            >
              <div 
                className={`absolute top-1 bottom-1 bg-[#a5a6f6] rounded-full transition-all duration-300 ease-out shadow-md ${mode === 'ai' ? 'left-1 w-[90px]' : 'left-[95px] w-[90px]'}`}
              />
              <div
                className={`relative z-10 px-6 py-2 text-base font-semibold transition-all duration-300 rounded-full ${mode === 'ai' ? 'text-white' : 'text-gray-600'}`}
              >
                AI对话
              </div>
              <div
                className={`relative z-10 px-6 py-2 text-base font-semibold transition-all duration-300 rounded-full ${mode === 'note' ? 'text-white' : 'text-gray-600'}`}
              >
                写笔记
              </div>
            </button>
          </div>

          {/* 输入框容器 */}
          <div className="relative">
            <textarea
              className="w-full h-32 rounded-xl border-2 border-gray-200 p-4 text-lg text-gray-800 focus:outline-none focus:border-[#a5a6f6] focus:ring-4 focus:ring-[#a5a6f6]/20 resize-none transition-all duration-300 placeholder-gray-400 bg-gray-50 focus:bg-white"
              placeholder={mode === 'note' ? '写下你的想法...' : '向AI提问或对话...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  document.getElementById('submit-btn')?.click();
                }
              }}
            />
            
            {/* 提交按钮 - 浮动在右下角 */}
            <button
              id="submit-btn"
              className={`absolute bottom-3 right-3 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center font-semibold text-white transform hover:scale-105 active:scale-95 ${
                (adding || chatSending) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#a5a6f6] hover:bg-[#7c7cf7] hover:shadow-xl'
              }`}
              onClick={async () => {
                if (mode === 'note') {
                  // 保存笔记到Supabase
                  if (!input.trim()) return;
                  setAdding(true);
                  try {
                    const { data, error } = await supabase
                      .from("notes")
                      .insert([{ user_id: userId, content: input.trim() }])
                      .select()
                      .single();
                    if (!error && data) {
                      setNotes([data, ...notes]);
                      setInput("");
                    } else {
                      console.error('保存笔记失败:', error);
                    }
                  } catch (error) {
                    console.error('保存笔记异常:', error);
                  } finally {
                    setAdding(false);
                  }
                } else {
                  // AI对话逻辑
                  if (!input.trim()) return;
                  setChatSending(true);
                  setChatMessages(msgs => [...msgs, { role: 'user', content: input }]);
                  
                  // 保存AI对话内容到Supabase
                  try {
                    const { data: noteData, error: noteError } = await supabase
                      .from("notes")
                      .insert([{ user_id: userId, content: input.trim() }])
                      .select()
                      .single();
                    
                    if (!noteError && noteData) {
                      // 添加到本地状态
                      setNotes([noteData, ...notes]);
                    } else {
                      console.error('保存AI对话到数据库失败:', noteError);
                    }
                  } catch (error) {
                    console.error('保存AI对话失败:', error);
                  }
                  
                  try {
                    const res = await fetch('/api/ai-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, message: input }),
                    });
                    const data = await res.json();
                    setChatMessages(msgs => [...msgs, { role: 'ai', content: data.reply || 'AI无回复' }]);
                    setInput("");
                  } catch {
                    setChatMessages(msgs => [...msgs, { role: 'ai', content: 'AI服务异常' }]);
                  }
                  setChatSending(false);
                }
              }}
              disabled={adding || chatSending}
            >
              {(adding || chatSending) ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          {/* 快捷键提示
          <div className="mt-3 text-xs text-gray-400 text-center">
            {mode === 'note' ? '💡 Cmd/Ctrl + Enter 快速记录' : '💡 Cmd/Ctrl + Enter 快速发送'}
          </div> */}
          {/* AI对话历史，仅AI模式下显示 */}
          {mode === 'ai' && (
            <div className="w-full mt-6 flex flex-col gap-3">
              {chatMessages.length > 0 && chatMessages[chatMessages.length-1].role === 'ai' && (
                <div className="text-left">
                  <span className="inline-block bg-[#f1f5fb] text-[#222] rounded-lg px-4 py-2 font-semibold">
                    {chatMessages[chatMessages.length-1].content}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 极简无分区便签墙 */}
        <div className="min-h-[60vh] max-w-4xl w-full flex flex-wrap gap-6 justify-center items-start mb-8">
          {notes.length === 0 ? (
            <div className="text-center text-gray-400 w-full">暂无笔记</div>
          ) : (
            notes.map((note, i) => (
              <NoteSticker key={note.id} content={note.content} index={i} />
            ))
          )}
        </div>

        {/* AI聊天按钮 - 只有自己的页面才显示
        {isOwnPage && (
          <div className="text-center">
            <button
              ref={chatBtnRef}
              className="w-40 h-16 rounded-full bg-[#e5e4fa] text-black text-xl shadow border border-[#d1d0e7] hover:bg-[#d1d0e7] transition-all"
              onClick={() => setShowChat(true)}
            >
              chat
            </button>
          </div>
        )} */}

        {/* AI聊天模态框 */}
        <ChatModal
          open={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          onSend={async msg => {
            setChatMessages([...chatMessages, { role: 'user', content: msg }]);
            setChatSending(true);
            try {
              const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, message: msg }),
              });
              const data = await res.json();
              setChatMessages(current => [...current, { role: 'ai', content: data.reply || 'AI 没有返回内容' }]);
            } catch {
              setChatMessages(current => [...current, { role: 'ai', content: 'AI 回复失败，请重试' }]);
            }
            setChatSending(false);
          }}
          sending={chatSending}
          anchorRef={chatBtnRef}
        />
      </div>
    </div>
  );
} 