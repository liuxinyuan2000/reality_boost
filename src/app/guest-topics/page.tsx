"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUserById } from "../utils/userUtils";
import LoadingSpinner from "../components/LoadingSpinner";

interface Topic {
  title: string;
  insight: string;
  suggestion: string;
  source: string;
}

function GuestTopicsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initiatorUserId = searchParams.get("initiatorUserId"); // TA的ID（发起NFC碰撞的人）
  
  const [initiatorUser, setInitiatorUser] = useState<any>(null);
  const [guestTopics, setGuestTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  
  // 位置信息状态
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // 获取TA（发起NFC碰撞的人）信息
  useEffect(() => {
    const getInitiatorUser = async () => {
      if (!initiatorUserId) {
        router.push('/');
        return;
      }
      
      try {
        const user = await getUserById(initiatorUserId);
        if (user) {
          setInitiatorUser(user);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        router.push('/');
      }
    };
    
    getInitiatorUser();
  }, [initiatorUserId, router]);

  // 生成基于TA兴趣的话题
  useEffect(() => {
    if (!initiatorUserId || !initiatorUser) return;

    const generateGuestTopics = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/generate-guest-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            initiatorUserId, // TA用户ID
            location: userLocation // 访客的位置信息
          }),
        });

        const data = await response.json();
        if (data.success && data.topics) {
          setGuestTopics(data.topics);
        }
      } catch (error) {
        console.error('生成访客话题失败:', error);
        // 提供基于TA的默认话题
        setGuestTopics([
          {
            title: "探索有趣的地方",
            insight: `${initiatorUser.username} 经常记录生活中的精彩瞬间`,
            suggestion: "可以聊聊你们都去过的有趣地方，分享各自的发现和体验",
            source: "基于TA的生活记录习惯"
          },
          {
            title: "聊聊共同兴趣",
            insight: "喜欢记录的人通常对很多事物都有独特见解",
            suggestion: "可以聊聊最近关注的话题，看看有什么共同点",
            source: "从记录习惯看出的兴趣倾向"
          },
          {
            title: "分享生活感悟",
            insight: "记录生活的人往往有很多有趣的思考",
            suggestion: "可以聊聊最近的生活感悟或者有意思的发现",
            source: "生活记录者的特质"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(generateGuestTopics, 1000);
    return () => clearTimeout(timer);
  }, [initiatorUserId, initiatorUser]);

  // 刷新访客话题
  const refreshGuestTopics = async () => {
    if (!initiatorUserId || !initiatorUser) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-guest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initiatorUserId,
          location: userLocation // 访客的位置信息
        }),
      });

      const data = await response.json();
      if (data.success && data.topics) {
        setGuestTopics(data.topics);
      }
    } catch (error) {
      console.error('刷新访客话题失败:', error);
    } finally {
      setLoading(false);
    }
  };



  if (showRegistration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--background-secondary)' }}>
        {/* 微信联系方式 */}
        <div className="text-center">
          <div 
            className="text-sm mb-4"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            联系我们
          </div>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText('_4youreyezonly77');
                // 简单的视觉反馈
                const btn = document.activeElement as HTMLButtonElement;
                const originalText = btn.textContent;
                btn.textContent = '已复制！';
                setTimeout(() => {
                  if (btn) btn.textContent = originalText;
                }, 1000);
              } catch (err) {
                console.log('复制失败，请手动复制');
              }
            }}
            className="text-lg font-medium px-6 py-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ 
              color: 'var(--primary)', 
              borderColor: 'var(--primary)',
              background: 'var(--background)'
            }}
          >
            微信：_4youreyezonly77
          </button>
          <div 
            className="text-sm mt-3"
            style={{ color: 'var(--foreground-tertiary)' }}
          >
            点击复制微信号添加好友咨询
          </div>
        </div>

        <button
          onClick={() => setShowRegistration(false)}
          className="mt-6 text-sm"
          style={{ color: 'var(--primary)' }}
        >
          ← 返回查看话题
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-secondary)' }}>
      {/* 顶部导航 */}
      <nav className="glass-effect sticky top-0 z-40 border-b" style={{ borderColor: 'var(--separator)' }}>
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
                Nebula Key
              </span>
            </div>
            

          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 
              className="text-3xl font-bold animate-fade-in"
              style={{ color: 'var(--foreground)' }}
            >
              发现有趣的话题
            </h1>
            <button
              onClick={refreshGuestTopics}
              disabled={loading}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50"
              style={{ 
                background: 'var(--background)',
                border: '1px solid var(--separator)',
                color: 'var(--foreground-secondary)'
              }}
              title="重新生成话题"
            >
              <svg 
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
          
          {initiatorUser && (
            <>
              <p 
                className="text-lg mb-2"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{initiatorUser.username}</span> 可能对这些话题感兴趣
              </p>
              <div 
                className="text-base mb-8"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                基于TA的兴趣为你推荐聊天话题
              </div>
            </>
          )}
        </div>

        {/* 话题列表 */}
        <div className="space-y-6 mb-12">
          {loading ? (
            <div className="text-center py-16">
              <LoadingSpinner 
                size="lg" 
                text="AI正在分析中..." 
                className="animate-pulse"
              />
              <div 
                className="mt-6 text-sm animate-bounce"
                style={{ color: 'var(--foreground-tertiary)' }}
              >
                正在为你推荐个性化话题...
              </div>
            </div>
          ) : (
            <>
              {guestTopics.length === 0 ? (
                <div className="text-center py-16">
                  <div 
                    className="text-lg mb-2"
                    style={{ color: 'var(--foreground-secondary)' }}
                  >
                    话题生成中...
                  </div>
                  <div 
                    className="text-sm animate-pulse"
                    style={{ color: 'var(--foreground-tertiary)' }}
                  >
                    请稍等片刻
                  </div>
                </div>
              ) : (
                <ul className="space-y-6">
                  {guestTopics.map((topic, i) => (
                    <li 
                      key={i} 
                      className="p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up opacity-0"
                      style={{ 
                        background: 'var(--background)',
                        border: '1px solid var(--separator)',
                        boxShadow: 'var(--shadow-2)',
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
                          className="text-sm mb-3 italic"
                          style={{ color: 'var(--secondary)' }}
                        >
                          💡 {topic.insight}
                        </div>
                      )}
                      <div 
                        className="mb-3"
                        style={{ color: 'var(--foreground-secondary)' }}
                      >
                        {topic.suggestion}
                      </div>
                      {topic.source && (
                        <div 
                          className="text-xs"
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

        {/* 注册邀请区域 */}
        <div 
          className="text-center p-8 rounded-2xl"
          style={{ 
            background: 'var(--background)',
            border: '1px solid var(--separator)',
            boxShadow: 'var(--shadow-2)'
          }}
        >
          <div 
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            想要更精准的话题推荐？
          </div>
          <p 
            className="text-base mb-6"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            获取Nebula项链，开始记录你的生活<br />
            AI 会根据你和 {initiatorUser?.username} 的共同兴趣生成个性化话题
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={() => setShowRegistration(true)}
              className="button-primary px-8 py-3"
            >
              立即获取
            </button>
          </div>
          
          <div 
            className="text-xs mt-4"
            style={{ color: 'var(--foreground-tertiary)' }}
          >
            注册后可以与 {initiatorUser?.username} 生成基于双方兴趣的共同话题
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestTopicsPage() {
  return (
    <Suspense>
      <GuestTopicsInner />
    </Suspense>
  );
} 