"use client";
import { useState } from "react";
import { supabase } from "./supabaseClient";
import { saveUserToStorage } from "./utils/userUtils";

interface AuthFormProps {
  onAuth: (user: any) => void;
  customUserId?: string; // 新增：自定义用户ID
}

export default function AuthForm({ onAuth, customUserId }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (isLogin) {
      // 登录：查找用户名和密码
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();
      if (error || !data) setError("用户名或密码错误");
      else {
        // 保存用户信息到localStorage
        saveUserToStorage(data);
        onAuth(data);
      }
    } else {
      // 注册：先查重，再插入
      const { data: exist } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (exist) {
        setError("用户名已存在");
      } else {
        // 如果有自定义用户ID，使用它；否则让数据库自动生成
        const userData = customUserId 
          ? { username, password, id: customUserId }
          : { username, password };
        
        const { data, error } = await supabase
          .from("users")
          .insert(userData)
          .select()
          .single();
        if (error || !data) setError("注册失败");
        else {
          // 保存用户信息到localStorage
          saveUserToStorage(data);
          onAuth(data);
        }
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 w-full max-w-sm mx-auto flex flex-col gap-4 mt-16">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">{isLogin ? "登录" : "注册"}</h2>
      {customUserId && !isLogin && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>专属用户ID:</strong> {customUserId}
          </div>
        </div>
      )}
      <input
        type="text"
        className="border rounded p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 text-black"
        placeholder="用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        className="border rounded p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 text-black"
        placeholder="密码"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="bg-[#a5a6f6] hover:bg-[#7c7cf7] text-white font-semibold rounded p-2 transition-all disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "处理中..." : isLogin ? "登录" : "注册"}
      </button>
      <div className="text-center text-sm mt-2">
        {isLogin ? (
          <span className="text-gray-600">没有账号？ <button type="button" className="text-blue-600 underline" onClick={() => setIsLogin(false)}>注册</button></span>
        ) : (
          <span className="text-gray-600">已有账号？ <button type="button" className="text-blue-600 underline" onClick={() => setIsLogin(true)}>登录</button></span>
        )}
      </div>
    </form>
  );
} 