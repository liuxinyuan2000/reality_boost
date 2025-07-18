"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser, getUserById } from "../../utils/userUtils";
import html2canvas from "html2canvas";
import DeconstructPoster from "./deconstructPoster";

interface Tag {
  text: string;
}

// 苹果风格加载组件
function LoadingPoster() {
  return (
    <div 
      className="flex flex-col items-center justify-center p-16 rounded-3xl animate-fade-in"
      style={{ 
        background: 'var(--background)',
        boxShadow: 'var(--shadow-2)',
        minHeight: '400px',
        minWidth: '300px'
      }}
    >
      {/* 主加载动画 */}
      <div className="relative mb-8">
        <div 
          className="w-20 h-20 rounded-full border-4 border-transparent border-t-current animate-spin"
          style={{ color: 'var(--primary)' }}
        />
        <div 
          className="absolute inset-4 w-12 h-12 rounded-full border-2 border-transparent border-t-current animate-spin"
          style={{ 
            color: 'var(--primary)',
            animationDirection: 'reverse',
            animationDuration: '1s'
          }}
        />
      </div>
      
      {/* 加载文字动画 */}
      <div className="text-center">
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--foreground)' }}
        >
          AI 正在创作中
        </h3>
        <div className="flex items-center justify-center gap-1">
          <div 
            className="text-base"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            分析你的笔记
          </div>
          <div className="flex gap-1 ml-1">
            <div 
              className="w-1 h-1 rounded-full animate-pulse-custom"
              style={{ 
                background: 'var(--primary)',
                animationDelay: '0s'
              }}
            />
            <div 
              className="w-1 h-1 rounded-full animate-pulse-custom"
              style={{ 
                background: 'var(--primary)',
                animationDelay: '0.2s'
              }}
            />
            <div 
              className="w-1 h-1 rounded-full animate-pulse-custom"
              style={{ 
                background: 'var(--primary)',
                animationDelay: '0.4s'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* 进度条动画 */}
      <div 
        className="w-48 h-1 rounded-full mt-6 overflow-hidden"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div 
          className="h-full rounded-full animate-pulse-custom"
          style={{ 
            background: `linear-gradient(90deg, var(--primary), var(--primary-light))`,
            width: '60%',
            animation: 'slideIn 2s infinite'
          }}
        />
      </div>
    </div>
  );
}

export default function UserTagsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // 获取当前用户和页面用户信息
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true);
      
      const currentUserData = getCurrentUser();
      setCurrentUser(currentUserData);
      
      // 获取页面用户信息
      const pageUser = await getUserById(userId);
      setUser(pageUser);
      
      if (!currentUserData) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }
      
      // 如果是自己的页面，直接允许访问
      if (currentUserData.id === userId) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }
      
      // 检查是否是好友
      try {
        const response = await fetch(`/api/friends?userId=${currentUserData.id}`);
        if (response.ok) {
          const data = await response.json();
          const isFriend = data.friends.some((friend: any) => friend.id === userId);
          setHasAccess(isFriend);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('检查好友状态失败:', error);
        setHasAccess(false);
      }
      
      setCheckingAccess(false);
    };
    
    checkAccess();
  }, [userId]);

  // 获取标签数据
  useEffect(() => {
    if (!hasAccess || !currentUser) return;
    
      async function fetchTags() {
        setLoading(true);
      const startTime = Date.now();
        try {
          const res = await fetch(`/api/generate-tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
          });
          const data = await res.json();
          setTags(data.tags || []);
        } catch {
          setTags([]);
        }
      // 智能延迟：只有在请求很快完成时才添加最小延迟以展示动画
      const elapsedTime = Date.now() - startTime;
      const minimumLoadingTime = 400; // 进一步减少到400ms
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => setLoading(false), minimumLoadingTime - elapsedTime);
      } else {
        setLoading(false);
      }
    }
    fetchTags();
  }, [hasAccess, currentUser, userId]);

  // 保存为图片
  const handleSave = async () => {
    const el = document.getElementById("tag-poster");
    if (!el) return;
    const canvas = await html2canvas(el);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user?.username || "user"}-poster.png`;
    a.click();
  };

  // 重新生成标签（只有本人可以重新生成）
  const handleRegenerate = async () => {
    if (!user || !currentUser || currentUser.id !== userId) return;
    setLoading(true);
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/generate-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      setTags([]);
    }
    // 智能延迟：只有在请求很快完成时才添加最小延迟以展示动画
    const elapsedTime = Date.now() - startTime;
    const minimumLoadingTime = 400; // 进一步减少到400ms
    if (elapsedTime < minimumLoadingTime) {
      setTimeout(() => setLoading(false), minimumLoadingTime - elapsedTime);
    } else {
    setLoading(false);
    }
  };

  // 检查访问权限中
  if (checkingAccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="animate-pulse-custom">
          <div 
            className="w-16 h-16 rounded-full border-4 border-transparent border-t-current"
            style={{ color: 'var(--primary)' }}
          />
        </div>
      </div>
    );
  }

  // 没有访问权限
  if (!hasAccess) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="max-w-md w-full card p-10 text-center animate-fade-in">
          <div className="text-6xl mb-6">🔒</div>
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            访问受限
          </h2>
          <p 
            className="mb-6"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {currentUser ? '只有好友才能查看状态图。请先添加对方为好友。' : '请先登录才能查看状态图。'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="button-primary px-6 py-3"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="animate-pulse-custom">
          <div 
            className="w-16 h-16 rounded-full border-4 border-transparent border-t-current"
            style={{ color: 'var(--primary)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{ background: 'var(--background-secondary)' }}
    >
      {/* 顶部标题 */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 
          className="text-3xl font-light mb-2"
          style={{ color: 'var(--foreground)' }}
        >
          {user.username} 的状态标签
        </h1>
        <p 
          className="text-base"
          style={{ color: 'var(--foreground-secondary)' }}
        >
          AI 分析生成的个性化标签
        </p>
      </div>

      {/* 标签海报区域 */}
      <div className="mb-8" id="tag-poster">
        {loading ? (
          <LoadingPoster />
        ) : (
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DeconstructPoster tags={tags.map(t => typeof t === 'string' ? t : t.text)} />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {/* 只有本人才能重新生成 */}
        {currentUser && currentUser.id === userId && (
        <button
          onClick={handleRegenerate}
          disabled={loading}
            className="button-secondary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-transparent border-t-current animate-spin"
                  style={{ borderTopColor: 'currentColor' }}
                />
                <span>生成中...</span>
              </div>
            ) : (
              '重新生成'
            )}
          </button>
        )}
        
        {/* 保存按钮 */}
        {!loading && (
          <button
            onClick={handleSave}
            className="button-primary px-8 py-3 text-lg"
          >
            保存图片
        </button>
        )}
        
        {/* 返回按钮 */}
        <button
          onClick={() => window.history.back()}
          className="button-secondary px-8 py-3 text-lg"
        >
          返回
        </button>
      </div>
    </div>
  );
} 