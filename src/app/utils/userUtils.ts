import { supabase } from "../supabaseClient";

export interface User {
  id: string;
  username: string;
  password?: string;
  created_at?: string;
}

// 获取当前登录用户
export const getCurrentUser = (): User | null => {
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('解析用户数据失败:', error);
    localStorage.removeItem('currentUser');
  }
  return null;
};

// 保存用户信息到localStorage
export const saveUserToStorage = (user: User) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// 清除用户信息
export const clearUserFromStorage = () => {
  localStorage.removeItem('currentUser');
};

// 清除所有用户相关数据
export const clearAllUserData = () => {
  localStorage.removeItem('currentUser');
  // 清除任何可能存储的聊天消息
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('chatMessages_')) {
      localStorage.removeItem(key);
    }
  });
};

// 通过用户ID获取用户信息
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error('通过ID查找用户失败:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

// 验证用户是否在数据库中存在
export const validateUser = async (user: User): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('验证用户失败:', error);
    return false;
  }
};

// 检查用户是否已登录
export const isUserLoggedIn = () => {
  return getCurrentUser() !== null;
}; 