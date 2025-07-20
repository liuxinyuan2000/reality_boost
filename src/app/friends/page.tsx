"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "../utils/userUtils";

interface Friend {
  id: string;
  username: string;
}

// 苹果风格加载组件
function LoadingFriends() {
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
          正在加载好友列表
        </h3>
        <div className="flex items-center justify-center gap-1">
          <div 
            className="text-base"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            获取好友信息
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

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      fetchFriends(currentUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFriends = async (userId: string) => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/friends?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
        
        // 只有在请求很快完成时才添加最小延迟以展示动画
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 150) {
          await new Promise(resolve => setTimeout(resolve, 150 - elapsedTime));
        }
      } else {
        console.error('获取好友列表失败');
      }
    } catch (error) {
      console.error('获取好友列表时发生错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string, friendUsername: string) => {
    if (!user) return;
    
    if (!confirm(`确定要删除好友 ${friendUsername} 吗？`)) return;
    
    try {
      const response = await fetch(`/api/friends?currentUserId=${user.id}&targetUserId=${friendId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFriends(friends.filter(friend => friend.id !== friendId));
        alert('删除好友成功');
      } else {
        alert('删除好友失败');
      }
    } catch (error) {
      console.error('删除好友失败:', error);
      alert('删除好友失败');
    }
  };

  if (!user) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="max-w-md w-full card p-10 text-center animate-fade-in">
          <div className="text-6xl mb-6">👋</div>
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            请先登录
          </h2>
          <p 
            className="mb-6"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            您需要登录后才能查看好友列表
          </p>
          <Link 
            href="/"
            className="button-primary px-6 py-3 inline-block"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ background: 'var(--background-secondary)' }}
    >
      {/* 顶部导航 */}
      <nav className="glass-effect sticky top-0 z-40 border-b mb-8" style={{ borderColor: 'var(--separator)' }}>
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
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                我的好友
              </span>
              <Link 
                href={`/${user.id}`}
                className="button-secondary text-sm py-2 px-4"
              >
                我的主页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                我的好友
              </h1>
              <p 
                className="text-base"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                {loading ? '加载中...' : `共 ${friends.length} 位好友`}
              </p>
            </div>
          </div>
        </div>

        {/* 好友列表 */}
        <div className="card animate-fade-in">
          {loading ? (
            <LoadingFriends />
          ) : friends.length === 0 ? (
            <div 
              className="p-12 text-center animate-fade-in"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              <div className="text-4xl mb-4">👥</div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                还没有好友
              </h3>
              <p className="mb-6">快去线下认识一些朋友，分享你们的状态吧！</p>
            </div>
          ) : (
            <div style={{ borderColor: 'var(--separator)' }} className="divide-y">
              {friends.map((friend, index) => (
                <div 
                  key={friend.id} 
                  className="p-6 transition-all duration-200 hover:bg-opacity-50"
                  style={{ 
                    animation: `fadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s both`,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ 
                          background: `linear-gradient(135deg, var(--primary), var(--primary-light))`
                        }}
                      >
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {friend.username}
                        </h3>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--foreground-secondary)' }}
                        >
                          好友
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/${friend.id}`}
                        className="button-primary text-sm px-4 py-2"
                      >
                        Nebula Key
                      </Link>
                      <Link 
                        href={`/${friend.id}/tags`}
                        className="button-secondary text-sm px-4 py-2"
                      >
                        查看状态
                      </Link>
                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                        className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                        style={{ 
                          background: 'var(--error)',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        删除好友
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 