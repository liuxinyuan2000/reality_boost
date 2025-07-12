"use client";
import { getCurrentUser } from "../utils/userUtils";
import { useState, useEffect } from "react";

export default function DebugUserPage() {
  const [user, setUser] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<string>('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // 显示原始 localStorage 数据
    try {
      const rawData = localStorage.getItem('currentUser');
      setLocalStorageData(rawData || 'null');
    } catch (error) {
      setLocalStorageData('Error: ' + error);
    }
  }, []);

  const clearUser = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setLocalStorageData('null');
  };

  return (
    <div className="min-h-screen bg-[#f1f5fb] py-8 px-4" style={{ color: '#222' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">用户信息调试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">当前登录用户</h2>
          {user ? (
            <div className="space-y-2">
              <div><strong>用户ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.id}</code></div>
              <div><strong>用户名:</strong> {user.username}</div>
              <div><strong>创建时间:</strong> {user.created_at}</div>
            </div>
          ) : (
            <div className="text-gray-500">未登录</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">LocalStorage 原始数据</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto" style={{ color: '#222' }}>
            {localStorageData}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">操作</h2>
          <button 
            onClick={clearUser}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            清除用户数据
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">说明</h3>
          <ul className="text-sm space-y-1">
            <li>• 用户信息存储在浏览器的 localStorage 中</li>
            <li>• 键名：'currentUser'</li>
            <li>• 值：JSON 格式的用户对象</li>
            <li>• 清除数据后需要重新登录</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 