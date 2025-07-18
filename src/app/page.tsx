"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthForm from './AuthForm';
import { getCurrentUser, clearUserFromStorage, User } from './utils/userUtils';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearUserFromStorage();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-secondary)' }}>
        <LoadingSpinner size="lg" text="" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--background-secondary)' }}>
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-8">
            <div 
              className="text-7xl font-light mb-6"
              style={{ color: 'var(--primary)' }}
            >
              ✦
            </div>
            <h1 
              className="text-5xl font-light mb-4 tracking-tight"
              style={{ 
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Nebula
            </h1>
            <p 
              className="text-xl font-normal max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              用 AI 记录生活轨迹<br />
              与朋友分享专属标签
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <AuthForm onAuth={setUser} />
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <FeatureCard 
            icon="🤖"
            title="AI 智能分析"
            description="自动生成个性化标签"
          />
          <FeatureCard 
            icon="📱"
            title="NFC 碰撞"
            description="线下交友，线上互动"
          />
          <FeatureCard 
            icon="🎯"
            title="Nebula Key"
            description="发现有趣的聊天话题"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-secondary)' }}>
      {/* Navigation Bar */}
      <nav className="glass-effect sticky top-0 z-50 border-b" style={{ borderColor: 'var(--separator)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            </div>
            
            <div className="flex items-center gap-4">
              <span 
                className="text-sm"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                {user.username}
              </span>
              <Link 
                href={`/${user.id}`}
                className="button-primary text-sm py-2 px-4"
              >
                我的主页
              </Link>
              <button 
                onClick={handleLogout}
                className="button-secondary text-sm py-2 px-4"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 
            className="text-4xl font-light mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            欢迎回来，{user.username}
          </h1>
          <p 
            className="text-lg"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            开始记录你的生活轨迹
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <ActionCard 
            title="开始记笔记"
            description="记录此刻的想法和感受"
            icon="✏️"
            href={`/${user.id}`}
            primary
          />
          <ActionCard 
            title="查看我的状态"
            description="AI 生成的个性化状态标签"
            icon="🏷️"
            href={`/${user.id}/tags`}
          />
          <ActionCard 
            title="好友列表"
            description="查看已添加的好友"
            icon="👥"
            href="/friends"
          />
          <ActionCard 
            title="NFC 功能"
            description="测试 NFC 碰撞功能"
            icon="📱"
            href="/test-nfc"
          />
        </div>

        {/* Personal Link Section */}
        <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            你的专属链接
          </h3>
          <div 
            className="p-4 rounded-xl mb-4"
            style={{ 
              background: 'var(--background-secondary)',
              border: '1px solid var(--separator)'
            }}
          >
            <div className="flex items-center justify-between">
              <code 
                className="text-sm flex-1 mr-4"
                style={{ 
                  color: 'var(--foreground-secondary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {typeof window !== 'undefined' ? `${window.location.origin}/${user.id}` : `/${user.id}`}
              </code>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/${user.id}`;
                  navigator.clipboard.writeText(url);
                  // 简单的反馈，可以后续优化为toast
                  alert('链接已复制到剪贴板！');
                }}
                className="button-secondary text-sm py-1 px-3"
              >
                复制
              </button>
            </div>
          </div>
          <p 
            className="text-sm"
            style={{ color: 'var(--foreground-tertiary)' }}
          >
            分享这个链接，让朋友找到你的专属页面
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div 
      className="card p-6 text-center"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </h3>
      <p 
        className="text-sm"
        style={{ color: 'var(--foreground-secondary)' }}
      >
        {description}
      </p>
    </div>
  );
}

// Action Card Component
function ActionCard({ title, description, icon, href, primary = false }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="block">
             <div 
         className={`card p-6 h-full transition-all duration-300 ${primary ? 'ring-2 ring-opacity-50' : ''}`}
         style={{ 
           background: primary ? 'var(--primary)' : 'var(--background)',
           color: primary ? 'white' : 'var(--foreground)',
           ...(primary ? { '--tw-ring-color': 'var(--primary)' } : {})
         } as React.CSSProperties}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p 
              className="text-sm"
              style={{ 
                color: primary ? 'rgba(255,255,255,0.8)' : 'var(--foreground-secondary)' 
              }}
            >
              {description}
            </p>
          </div>
          <div 
            className="text-lg opacity-50"
            style={{ 
              color: primary ? 'white' : 'var(--foreground-tertiary)' 
            }}
          >
            →
          </div>
        </div>
      </div>
    </Link>
  );
}
