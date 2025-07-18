'use client';

import { useState, useEffect } from 'react';
import { Category } from '../[userId]/page';

interface CategoryFilterProps {
  onFilterChange: (categoryId: string | null) => void;
  selectedCategoryId: string | null;
  currentUserId?: string;
}

export default function CategoryFilter({ 
  onFilterChange, 
  selectedCategoryId,
  currentUserId 
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 获取分类列表
  const fetchCategories = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchCategories();
    }
  }, [currentUserId]);

  // 监听分类更新事件
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCategoriesUpdate = () => {
      if (currentUserId) {
        fetchCategories();
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, [currentUserId]);

  // 获取当前选中分类的信息
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  // 处理分类选择
  const handleCategorySelect = (categoryId: string | null) => {
    onFilterChange(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 筛选按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      >
        {selectedCategory ? (
          <>
            <div 
              className="w-4 h-4 rounded-md flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: selectedCategory.color }}
            >
              {selectedCategory.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{selectedCategory.name}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm text-gray-600">全部分类</span>
          </>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 菜单内容 */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {/* 全部分类选项 */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                !selectedCategoryId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="font-medium">全部分类</div>
                <div className="text-xs text-gray-500">显示所有笔记</div>
              </div>
            </button>

            {/* 分类列表 */}
            {categories.length > 0 && (
              <div className="border-t border-gray-100">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedCategoryId === category.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {category.name}
                        {category.is_private && (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.is_private ? '私密分类' : '公开分类'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 空状态 */}
            {categories.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm">暂无分类</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 