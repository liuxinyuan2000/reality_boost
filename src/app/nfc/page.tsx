"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser, getUserById } from "../utils/userUtils";

function NFCPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nfcUserId = searchParams.get("id");

  // 获取当前登录用户
  useEffect(() => {
    getCurrentUser();
  }, []);

  // 获取NFC用户信息
  useEffect(() => {
    const getNFCUser = async () => {
      if (!nfcUserId) return;
      await getUserById(nfcUserId);
    };
    getNFCUser();
  }, [nfcUserId]);

  // 处理页面跳转逻辑
  useEffect(() => {
    const handleNavigation = async () => {
      if (!nfcUserId) {
        router.push('/');
        return;
      }
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push('/');
        return;
      }
      // NFC碰撞后跳转到对方页面，会自动触发共同话题生成
      router.push(`/${nfcUserId}`);
    };
    const timer = setTimeout(() => {
      handleNavigation();
    }, 1000); // 稍微延长一点，让用户看到碰撞成功的提示
    return () => clearTimeout(timer);
  }, [nfcUserId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1f5fb] to-[#e6e6fa]">
      <div className="text-center bg-white rounded-3xl shadow-lg p-10 max-w-md mx-4">
        {nfcUserId ? (
          <>
            <div className="text-6xl mb-6 animate-bounce">📱✨</div>
            <div className="text-2xl font-bold text-[#6c4cff] mb-4">碰撞成功！</div>
            <div className="text-gray-600 mb-6">
              正在为您生成有趣的共同话题...
            </div>
            <div className="animate-pulse bg-gradient-to-r from-[#a5a6f6] to-[#7c7cf7] h-2 rounded-full mb-4"></div>
            <div className="text-sm text-gray-500">
              即将跳转到对方主页
            </div>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a5a6f6] mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700 mb-2">等待NFC碰撞...</div>
            <div className="text-gray-500">
              请将设备靠近对方的NFC标签
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function NFCPage() {
  return (
    <Suspense>
      <NFCPageInner />
    </Suspense>
  );
} 