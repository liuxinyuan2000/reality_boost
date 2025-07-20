'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '../[userId]/page';

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: () => void;
  currentUserId?: string;
}

interface NewCategoryData {
  name: string;
  is_private: boolean;
}

const defaultColors = [
  '#3B82F6', '#10B981', '#EF4444', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#EAB308'
];

const defaultIcons = [
  '📁', '📚', '💭', '💡', '📖', '🎯', '💼', '🏠',
  '🎨', '🔬', '🎵', '🍕', '✈️', '🎮', '💪', '📷'
];

export default function CategoryManagement({ 
  isOpen, 
  onClose, 
  onCategoryUpdated,
  currentUserId 
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<NewCategoryData>({
    name: '',
    is_private: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭模态框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // 获取分类列表
  const fetchCategories = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/categories?userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchCategories();
    }
  }, [isOpen, currentUserId]);

  // 随机选择颜色和图标
  const getRandomColor = () => defaultColors[Math.floor(Math.random() * defaultColors.length)];
  const getRandomIcon = () => defaultIcons[Math.floor(Math.random() * defaultIcons.length)];

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !currentUserId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: newCategory.name,
          color: getRandomColor(),
          icon: getRandomIcon(),
          isPrivate: newCategory.is_private
        })
      });

      if (response.ok) {
        setNewCategory({ name: '', is_private: false });
        await fetchCategories();
        onCategoryUpdated();
        onClose(); // 创建成功后自动关闭模态框回到主页
      } else {
        const errorData = await response.json();
        alert(errorData.error || '创建文件夹失败');
      }
    } catch (error) {
      console.error('Error creating category:', error);
              alert('创建文件夹时发生错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新分类
  const handleUpdateCategory = async (category: Category) => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          userId: currentUserId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          isPrivate: category.is_private
        })
      });

      if (response.ok) {
        setEditingCategory(null);
        await fetchCategories();
        onCategoryUpdated();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('确定要删除这个文件夹吗？删除后，该文件夹下的所有笔记将变为无文件夹状态。')) {
      return;
    }

    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories?categoryId=${categoryId}&userId=${currentUserId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchCategories();
        onCategoryUpdated();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // 如果没有用户ID，显示错误信息
  if (!currentUserId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">无法访问文件夹管理</h3>
            <p className="text-gray-600 mb-4">请先登录或注册账户</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-4 border-b" style={{ background: 'var(--background-secondary)', borderColor: 'var(--separator)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>分类管理</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* 直接显示创建分类表单 */}
          <div className="mb-6 space-y-4">
            {/* 分类名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类名称</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="如：工作、学习、生活..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900 bg-white placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory();
                  }
                }}
              />
            </div>

            {/* 是否私密 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="text-sm font-medium text-gray-700">私密分类</label>
                <p className="text-xs text-gray-500 mt-1">私密分类只有你可以访问</p>
              </div>
              <button
                onClick={() => setNewCategory({ ...newCategory, is_private: !newCategory.is_private })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  newCategory.is_private ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    newCategory.is_private ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 创建按钮 */}
            <button
              onClick={handleCreateCategory}
              disabled={!newCategory.name.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '创建中...' : '创建分类'}
            </button>
          </div>

          {/* 分类列表 */}
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                {editingCategory?.id === category.id ? (
                  /* 编辑模式 */
                  <CategoryEditForm
                    category={editingCategory}
                    onSave={handleUpdateCategory}
                    onCancel={() => setEditingCategory(null)}
                    isLoading={isLoading}
                  />
                ) : (
                  /* 显示模式 */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {category.name}
                          {category.is_private && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category.is_private ? '私密文件夹' : '公开文件夹'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>还没有创建任何文件夹</p>
                <p className="text-sm mt-1">点击上方按钮创建你的第一个文件夹</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 分类编辑表单组件（保持简单）
function CategoryEditForm({ 
  category, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  category: Category;
  onSave: (category: Category) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [editData, setEditData] = useState(category);

  return (
    <div className="space-y-4">
      {/* 分类名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">文件夹名称</label>
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        />
      </div>

      {/* 是否私密 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">私密文件夹</label>
        <button
          onClick={() => setEditData({ ...editData, is_private: !editData.is_private })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            editData.is_private ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              editData.is_private ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(editData)}
          disabled={!editData.name.trim() || isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '保存中...' : '保存修改'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
} 