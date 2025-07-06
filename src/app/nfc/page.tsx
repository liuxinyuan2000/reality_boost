"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { getCurrentUser, getUserById } from "../utils/userUtils";

export default function NFCPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nfcUserId = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nfcUser, setNfcUser] = useState<any>(null);

  // 获取当前登录用户
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 获取NFC用户信息
  useEffect(() => {
    const getNFCUser = async () => {
      if (!nfcUserId) return;
      
      const user = await getUserById(nfcUserId);
      if (user) {
        setNfcUser(user);
      }
    };

    getNFCUser();
  }, [nfcUserId]);

  // 处理页面跳转逻辑
  useEffect(() => {
    const handleNavigation = async () => {
      if (!nfcUserId) {
        // 没有NFC ID，跳转到主页
        router.push('/');
        return;
      }

      if (!currentUser) {
        // 用户未登录，跳转到主页进行注册/登录
        router.push('/');
        return;
      }

      // 用户已登录，跳转到用户专属页面
      router.push(`/${nfcUserId}`);
    };

    // 延迟一点时间确保数据加载完成
    const timer = setTimeout(() => {
      handleNavigation();
    }, 500);

    return () => clearTimeout(timer);
  }, [nfcUserId, currentUser, router]);

  // 加载状态显示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a5a6f6] mx-auto mb-4"></div>
          <div className="text-gray-600">正在识别NFC...</div>
          <div className="text-sm text-gray-500 mt-2">
            {nfcUserId ? `NFC ID: ${nfcUserId}` : '等待NFC数据...'}
          </div>
        </div>
      </div>
    );
  }

  // 这个组件通常不会显示，因为会立即跳转
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a5a6f6] mx-auto mb-4"></div>
        <div className="text-gray-600">正在跳转...</div>
      </div>
    </div>
  );
} 