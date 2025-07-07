"use client";
import { Suspense, useEffect } from "react";
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
      router.push(`/${nfcUserId}`);
    };
    const timer = setTimeout(() => {
      handleNavigation();
    }, 500);
    return () => clearTimeout(timer);
  }, [nfcUserId, router]);

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

export default function NFCPage() {
  return (
    <Suspense>
      <NFCPageInner />
    </Suspense>
  );
} 