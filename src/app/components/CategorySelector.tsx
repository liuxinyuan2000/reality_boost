"use client";

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_private: boolean;
}

interface CategorySelectorProps {
  userId: string;
  selectedCategoryId?: string;
  isPrivate: boolean;
  onCategoryChange: (categoryId: string | undefined) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onCreateCategory?: () => void;
  className?: string;
}

export default function CategorySelector({
  userId,
  selectedCategoryId,
  isPrivate,
  onCategoryChange,
  onPrivateChange,
  onCreateCategory,
  className = ''
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // 获取用户分类
  const fetchCategories = async () => {
    if (!userId) {
      console.log('CategorySelector: userId为空，无法获取分类');
      setLoading(false);
      return;
    }
    
    try {
      console.log('CategorySelector: 开始获取分类，userId:', userId);
      const response = await fetch(`/api/categories?userId=${userId}`);
      const data = await response.json();
      
      console.log('CategorySelector: API响应数据:', data);
      
      if (data.categories) {
        setCategories(data.categories);
        console.log('CategorySelector: 设置分类数据:', data.categories);
      } else {
        console.log('CategorySelector: API未返回分类数据');
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  // 监听分类更新事件
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCategoriesUpdate = () => {
      fetchCategories();
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, [userId]);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 分类选择器 */}
      <div className="relative">
        <label 
          className="text-sm font-medium mb-2 block"
          style={{ color: 'var(--foreground)' }}
        >
          选择分类
        </label>
        
        <div
          className="relative w-full cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200"
            style={{
              background: 'var(--background)',
              borderColor: showDropdown ? 'var(--primary)' : 'var(--separator)',
              boxShadow: showDropdown ? '0 0 0 3px rgba(0, 122, 255, 0.1)' : 'none'
            }}
          >
            <div className="flex items-center gap-3">
              {selectedCategory ? (
                <>
                  <span className="text-lg">{selectedCategory.icon}</span>
                  <span 
                    className="font-medium"
                    style={{ color: selectedCategory.color }}
                  >
                    {selectedCategory.name}
                  </span>
                  {selectedCategory.is_private && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      私有
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-lg">📝</span>
                  <span style={{ color: 'var(--foreground-secondary)' }}>
                    选择分类
                  </span>
                </>
              )}
            </div>
            
            <div 
              className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              style={{ color: 'var(--foreground-tertiary)' }}
            >
              ▼
            </div>
          </div>
        </div>

        {/* 下拉菜单 */}
        {showDropdown && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border animate-fade-in"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--separator)',
              boxShadow: 'var(--shadow-3)'
            }}
          >
            <div className="max-h-60 overflow-y-auto py-2">
              {/* 无分类选项 */}
              <div
                className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-opacity-50"
                style={{
                  backgroundColor: !selectedCategoryId ? 'var(--background-secondary)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!selectedCategoryId) return;
                  e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!selectedCategoryId) return;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  onCategoryChange(undefined);
                  setShowDropdown(false);
                }}
              >
                <span className="text-lg">📝</span>
                <span style={{ color: 'var(--foreground-secondary)' }}>无分类</span>
              </div>

              {/* 分类列表 */}
              {loading ? (
                <div className="px-4 py-3 text-center" style={{ color: 'var(--foreground-secondary)' }}>
                  加载中...
                </div>
              ) : categories.length === 0 ? (
                <div className="px-4 py-3 text-center" style={{ color: 'var(--foreground-secondary)' }}>
                  暂无分类
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-opacity-50"
                    style={{
                      backgroundColor: selectedCategoryId === category.id ? 'var(--background-secondary)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategoryId === category.id) return;
                      e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategoryId === category.id) return;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      onCategoryChange(category.id);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span 
                      className="font-medium flex-1"
                      style={{ color: category.color }}
                    >
                      {category.name}
                    </span>
                    {category.is_private && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        私有
                      </span>
                    )}
                  </div>
                ))
              )}

              {/* 创建新分类按钮 */}
              {onCreateCategory && (
                <>
                  <div 
                    className="mx-2 my-2 border-t"
                    style={{ borderColor: 'var(--separator)' }}
                  />
                  <div
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-opacity-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      onCreateCategory();
                      setShowDropdown(false);
                    }}
                  >
                    <span className="text-lg">➕</span>
                    <span style={{ color: 'var(--primary)' }}>创建新分类</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 私有设置 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            私有笔记
          </span>
          <span className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
            只有自己可见
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => onPrivateChange(!isPrivate)}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
            isPrivate ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          style={{
            backgroundColor: isPrivate ? 'var(--primary)' : 'var(--separator)'
          }}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
              isPrivate ? 'translate-x-6' : 'translate-x-0.5'
            }`}
            style={{ boxShadow: 'var(--shadow-1)' }}
          />
        </button>
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 