"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser, getUserById } from "../utils/userUtils";

function NFCPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nfcUserId = searchParams.get("id"); // 这是TA的ID（发起NFC碰撞的人）
  const [initiatorUser, setInitiatorUser] = useState<any>(null);
  const [showCollision, setShowCollision] = useState(false);

  // 获取TA（发起NFC碰撞的人）的信息
  useEffect(() => {
    const getInitiatorUser = async () => {
      if (!nfcUserId) return;
      const user = await getUserById(nfcUserId);
      setInitiatorUser(user);
    };
    getInitiatorUser();
  }, [nfcUserId]);

  // 处理页面跳转逻辑
  useEffect(() => {
    const checkUsersAndRedirect = async () => {
      if (!nfcUserId) {
        console.error("缺少NFC用户ID");
        return;
      }

      try {
        console.log("NFC页面接收到ID:", nfcUserId);
        
        // 显示碰撞动画
        setShowCollision(true);
        
        // 3秒后隐藏动画并进行跳转判断
        setTimeout(async () => {
          setShowCollision(false);
          
          const currentUser = getCurrentUser(); // 当前设备用户
          console.log("当前设备用户:", currentUser);
          
          // 当前设备用户未注册，跳转到访客话题页面
          // 显示TA（nfcUserId）可能感兴趣的话题
          if (!currentUser) {
            console.log("当前设备用户未注册，跳转到访客话题页面");
            router.push(`/guest-topics?initiatorUserId=${nfcUserId}`);
            return;
          }
          
          // 当前用户已注册，跳转到TA页面生成共同话题
          console.log("当前设备用户已注册，跳转到用户页面生成共同话题");
          router.push(`/${nfcUserId}`);
        }, 3000);
      } catch (error) {
        console.error("处理NFC跳转失败:", error);
      }
    };
    
    const timer = setTimeout(() => {
      checkUsersAndRedirect();
    }, 1500);
    
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
              {initiatorUser?.username ? 
                `与 ${initiatorUser.username} 连接成功！` : 
                '正在建立连接...'
              }
            </div>
            <div className="text-gray-600 mb-6">
              正在为您生成有趣的话题...
            </div>
            <div className="animate-pulse bg-gradient-to-r from-[#a5a6f6] to-[#7c7cf7] h-2 rounded-full mb-4"></div>
            <div className="text-sm text-gray-500">
              即将为您推荐个性化内容
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