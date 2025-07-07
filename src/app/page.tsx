"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AuthForm from "./AuthForm";
import { getCurrentUser, clearUserFromStorage } from "./utils/userUtils";

interface User {
  id: string;
  username: string;
  password?: string;
  created_at?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'note' | 'ai'>('note');

  // 检查localStorage中的用户信息
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // 登出
  const handleLogout = () => {
    clearUserFromStorage();
    setUser(null);
  };

  if (!user) {
    return <AuthForm onAuth={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#f1f5fb] flex flex-col items-center py-12">
      {/* Tab切换 */}
      <div className="flex mb-2 rounded-lg overflow-hidden border border-[#e6e6fa] bg-white shadow-sm" style={{ width: 420 }}>
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
      </div>
      {/* 输入区 */}
      <div className="w-[420px] bg-white rounded-xl shadow p-6 mb-8">
        <div className="text-xl font-bold text-[#222] mb-2">{mode === 'note' ? '写笔记' : 'AI对话'}</div>
        <textarea
          className="w-full h-28 rounded-lg border border-[#e6e6fa] p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#a5a6f6] resize-none mb-4"
          placeholder={mode === 'note' ? '写下你的想法...' : '向AI提问或对话...'}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="w-32 h-12 rounded-full bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white text-lg font-semibold shadow transition-all float-right"
          onClick={() => {
            if (mode === 'note') {
              // 原有保存笔记逻辑
            } else {
              // 预留AI对话逻辑
            }
          }}
        >
          {mode === 'note' ? '添加' : '聊天'}
        </button>
        <div className="clear-both" />
      </div>
      {/* 顶部用户信息栏 */}
      <div className="w-full max-w-md flex justify-between items-center mb-2">
        <span className="text-gray-700 text-sm">{user.username}</span>
        <div className="flex items-center gap-2">
          <Link 
            href={`/${user.id}`}
            className="text-sm text-purple-600 underline hover:text-purple-700"
            title="查看我的专属页面"
          >
            我的页面
          </Link>
          <Link 
            href="/test-nfc" 
            className="text-sm text-green-600 underline hover:text-green-700"
            title="测试NFC功能"
          >
            NFC测试
          </Link>
          <button onClick={handleLogout} className="text-sm text-blue-600 underline">登出</button>
        </div>
      </div>
      
      {/* 用户专属链接提示 */}
      <div className="w-full max-w-md mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 mb-2">
          <strong>你的专属链接:</strong>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-white px-2 py-1 rounded text-xs font-mono border flex-1">
            {typeof window !== 'undefined' ? `${window.location.origin}/${user.id}` : `/${user.id}`}
          </code>
          <button
            onClick={() => {
              const url = `${window.location.origin}/${user.id}`;
              navigator.clipboard.writeText(url);
              alert('专属链接已复制到剪贴板！');
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-all"
          >
            复制
          </button>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          分享这个链接，别人就能看到你的笔记了
        </div>
      </div>
      
      {/* NFC链接提示 */}
      <div className="w-full max-w-md mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 mb-2">
          <strong>你的NFC链接:</strong>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-white px-2 py-1 rounded text-xs font-mono border flex-1">
            {typeof window !== 'undefined' ? `${window.location.origin}/nfc?id=${user.id}` : `/nfc?id=${user.id}`}
          </code>
          <button
            onClick={() => {
              const url = `${window.location.origin}/nfc?id=${user.id}`;
              navigator.clipboard.writeText(url);
              alert('NFC链接已复制到剪贴板！');
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-all"
          >
            复制
          </button>
        </div>
        <div className="text-xs text-green-600 mt-1">
          将这个链接写入NFC标签，触碰时自动跳转到你的页面
        </div>
      </div>

      {/* 主要操作区域 */}
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nebula</h2>
          <p className="text-gray-600 mb-6">
            点击下面的按钮开始使用你的专属笔记页面
          </p>
          <Link 
            href={`/${user.id}`}
            className="inline-block bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-8 py-3 transition-all text-lg"
          >
            开始记笔记
          </Link>
        </div>
      </div>
    </div>
  );
}
