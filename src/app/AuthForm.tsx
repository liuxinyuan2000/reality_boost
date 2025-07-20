"use client";

import { useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "./utils/userUtils";

interface AuthFormProps {
  onAuth: (user: User) => void;
  customUserId?: string;
}

export default function AuthForm({ onAuth, customUserId }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
    if (isLogin) {
        // 登录逻辑
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

        if (error || !data) {
          throw new Error("用户名或密码错误");
        }

        if (data.password !== password) {
          throw new Error("用户名或密码错误");
        }

        // 保存到localStorage
        localStorage.setItem("currentUser", JSON.stringify(data));
        onAuth(data);
      } else {
        // 注册逻辑
        const userId = customUserId || crypto.randomUUID();
        
        const { data, error } = await supabase
          .from("users")
          .insert([{
            id: userId,
            username,
            password,
          }])
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            throw new Error("用户名已存在");
          }
          throw new Error("注册失败，请重试");
        }

        // 保存到localStorage
        localStorage.setItem("currentUser", JSON.stringify(data));
          onAuth(data);
        }
    } catch (err: any) {
      setError(err.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* 模式切换 */}
      <div className="flex items-center justify-center mb-8">
        <div 
          className="relative flex p-1 rounded-xl"
          style={{ background: 'var(--background-secondary)' }}
        >
                     <div 
             className={`absolute top-1 bottom-1 bg-white rounded-lg transition-all duration-300 ease-out shadow-sm ${
               isLogin ? 'left-1 w-[68px]' : 'left-[73px] w-[68px]'
             }`}
             style={{ boxShadow: 'var(--shadow-1)' }}
           />
           <button
             type="button"
             className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${
               isLogin ? 'text-gray-900' : 'text-gray-500'
             }`}
             style={{ width: '68px' }}
             onClick={() => setIsLogin(true)}
           >
             登录
           </button>
           <button
             type="button"
             className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${
               !isLogin ? 'text-gray-900' : 'text-gray-500'
             }`}
             style={{ width: '68px' }}
             onClick={() => setIsLogin(false)}
           >
             注册
           </button>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">


        {/* 用户名输入 */}
        <div className="space-y-2">
          <label 
            className="block text-sm font-medium"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            用户名
          </label>
      <input
        type="text"
            className="input-field w-full text-lg py-3"
            placeholder="输入你的用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
            autoComplete="username"
      />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <label 
            className="block text-sm font-medium"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            密码
          </label>
      <input
        type="password"
            className="input-field w-full text-lg py-3"
            placeholder="输入你的密码"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>

        {/* 错误信息 */}
        {error && (
          <div 
            className="p-4 rounded-xl animate-fade-in"
            style={{ 
              background: 'var(--error)',
              color: 'white'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-lg">⚠️</div>
              <div className="text-sm font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
      <button
        type="submit"
          className="button-primary w-full text-lg py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !username.trim() || !password.trim()}
      >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>处理中...</span>
            </div>
          ) : (
            isLogin ? "登录" : "注册"
          )}
        </button>

        {/* 功能说明 */}
        <div 
          className="text-center text-sm space-y-2 pt-4"
          style={{ color: 'var(--foreground-tertiary)' }}
        >
          <p>
            {isLogin ? "还没有账号？" : "已有账号？"}
            <button
              type="button"
              className="ml-1 font-medium transition-colors duration-200"
              style={{ color: 'var(--primary)' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "立即注册" : "立即登录"}
      </button>
          </p>
          {!isLogin && (
            <p className="text-xs leading-relaxed">
              注册后你将获得专属的个人页面，<br />
              可以记录笔记、生成 AI 标签、与朋友互动
            </p>
        )}
      </div>
    </form>
    </div>
  );
} 