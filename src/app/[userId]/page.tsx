"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { getCurrentUser, getUserById, saveUserToStorage } from "../utils/userUtils";
import AuthForm from "../AuthForm";

interface Note {
  id: string;
  content: string;
  created_at: string;
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

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnPage, setIsOwnPage] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  // 记笔记相关状态
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const chatBtnRef = useRef<HTMLButtonElement | null>(null);

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
  const handleAuthSuccess = async (authUser: any) => {
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用 Reality Note</h1>
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
          <a 
            href="/" 
            className="inline-block bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-6 py-3 transition-all"
          >
            返回主页
          </a>
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
                {user.username} 的笔记
              </h1>
              <p className="text-gray-600">
                {isOwnPage ? "这是你的个人笔记页面" : "这是别人的笔记页面"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="text-sm text-gray-500">
                  当前用户: {currentUser.username}
                </div>
              )}
              <a 
                href="/" 
                className="bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-4 py-2 transition-all"
              >
                返回主页
              </a>
            </div>
          </div>
          
          {/* 用户专属URL */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">专属链接:</div>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-2 rounded border text-sm font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/${userId}` : `/${userId}`}
              </code>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/${userId}`;
                  navigator.clipboard.writeText(url);
                  alert('链接已复制到剪贴板！');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-all"
              >
                复制链接
              </button>
            </div>
          </div>
        </div>

        {/* 记笔记区域 - 只有自己的页面才显示 */}
        {isOwnPage && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">写笔记</h2>
            <div className="relative w-full">
              <textarea
                className="w-full rounded-lg border border-gray-300 p-3 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-lg shadow text-black caret-black placeholder-black transition-all"
                rows={3}
                placeholder="写下你的想法..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              {/* 悬浮添加按钮 */}
              <button
                className={`absolute bottom-3 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-150
                  ${input.trim() ? "bg-[#a5a6f6] border-[#7c7cf7] hover:bg-[#7c7cf7] active:scale-95" : "bg-gray-200 border-gray-300 cursor-not-allowed opacity-60"}`}
                onClick={() => { handleAdd(); }}
                aria-label="添加笔记"
                disabled={!input.trim() || adding}
              >
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                  <rect x="17" y="7" width="6" height="26" rx="2" fill="white"/>
                  <rect x="7" y="17" width="26" height="6" rx="2" fill="white"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 笔记列表 */}
        <div className="grid gap-4 mb-8">
          {notes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-gray-600 mb-4">
                {isOwnPage ? "你还没有笔记，开始写第一篇吧！" : "这个用户还没有笔记"}
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              >
                <div className="text-gray-800 text-lg mb-2">{note.content}</div>
                <div className="text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI聊天按钮 - 只有自己的页面才显示 */}
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
        )}

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
            } catch (e) {
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