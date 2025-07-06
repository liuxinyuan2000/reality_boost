"use client";
import { getCurrentUser } from "../utils/userUtils";
import { useState, useEffect } from "react";

export default function TestNFCPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
        <div className="text-center p-8">
          <div className="text-2xl text-gray-600 mb-4">🔐</div>
          <div className="text-gray-600 mb-4">请先登录</div>
          <a 
            href="/" 
            className="inline-block bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-6 py-3 transition-all"
          >
            去登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5fb] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">NFC 测试页面</h1>
          <p className="text-gray-600">当前用户: {currentUser.username} (ID: {currentUser.id})</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 自己的NFC链接 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">自己的NFC链接</h3>
            <p className="text-gray-600 mb-4">点击下面的链接模拟触碰自己的NFC标签</p>
            <a 
              href={`/nfc?id=${currentUser.id}`}
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              触碰自己的NFC
            </a>
          </div>

          {/* 别人的NFC链接 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-blue-600 mb-2">别人的NFC链接</h3>
            <p className="text-gray-600 mb-4">点击下面的链接模拟触碰别人的NFC标签</p>
            <a 
              href="/nfc?id=other_user_id"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              触碰别人的NFC
            </a>
          </div>

          {/* 自己的专属页面 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">自己的专属页面</h3>
            <p className="text-gray-600 mb-4">直接访问你的专属笔记页面</p>
            <a 
              href={`/${currentUser.id}`}
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              访问专属页面
            </a>
          </div>

          {/* 无效链接 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">无效链接</h3>
            <p className="text-gray-600 mb-4">点击下面的链接测试无效NFC链接</p>
            <a 
              href="/nfc"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              无效NFC链接
            </a>
          </div>

          {/* 返回主页 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">返回主页</h3>
            <p className="text-gray-600 mb-4">返回应用主页</p>
            <a 
              href="/"
              className="inline-block bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              返回主页
            </a>
          </div>

          {/* 未登录测试 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-orange-600 mb-2">未登录测试</h3>
            <p className="text-gray-600 mb-4">先登出，然后测试NFC链接</p>
            <a 
              href="/"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2 transition-all"
            >
              去登出测试
            </a>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h3>
          <div className="space-y-2 text-gray-600">
            <p>• <strong>自己的NFC链接</strong>：会跳转到你的专属页面</p>
            <p>• <strong>别人的NFC链接</strong>：会跳转到别人的专属页面</p>
            <p>• <strong>无效链接</strong>：会跳转到主页</p>
            <p>• <strong>未登录状态</strong>：任何NFC链接都会跳转到登录页</p>
            <p>• 在真实NFC场景中，URL中的id参数会由NFC标签提供</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">你的链接信息</h4>
          <div className="space-y-2 text-sm">
            <div><strong>专属页面:</strong> <code className="bg-white px-2 py-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/${currentUser.id}` : `/${currentUser.id}`}</code></div>
            <div><strong>NFC链接:</strong> <code className="bg-white px-2 py-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/nfc?id=${currentUser.id}` : `/nfc?id=${currentUser.id}`}</code></div>
          </div>
        </div>
      </div>
    </div>
  );
} 