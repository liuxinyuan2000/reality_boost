"use client";

import { useEffect, useState } from 'react';
import { getCurrentUser, clearAllUserData } from '../utils/userUtils';
import Link from 'next/link';

export default function DebugUserPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleClearAll = () => {
    clearAllUserData();
    setCurrentUser(null);
    setMessage('所有用户数据已清除！');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">用户调试工具</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">当前用户信息:</h3>
            {currentUser ? (
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>用户名:</strong> {currentUser.username}</p>
              </div>
            ) : (
              <p className="text-gray-500">无当前用户</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">操作:</h3>
            <div className="space-y-2">
              <button
                onClick={handleClearAll}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                清除所有用户数据
              </button>
              
              <Link 
                href="/"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-center"
              >
                返回主页
              </Link>
            </div>
          </div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">解决文件夹创建问题:</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. 点击"清除所有用户数据"</li>
              <li>2. 返回主页</li>
              <li>3. 重新注册或登录</li>
                              <li>4. 尝试创建文件夹</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 