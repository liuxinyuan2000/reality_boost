'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Friend {
  id: string;
  username: string;
  folders: {
    id: string;
    name: string;
    icon: string;
    color: string;
    notesCount: number;
  }[];
}

interface MentionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mention: { type: 'folder', friendId: string, friendName: string, folderId: string, folderName: string, folderIcon: string }) => void;
  currentUserId: string;
  searchQuery: string;
  position: { top: number, left: number };
}

export default function MentionDropdown({
  isOpen,
  onClose,
  onSelect,
  currentUserId,
  searchQuery,
  position
}: MentionDropdownProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取好友及其文件夹
  useEffect(() => {
    if (!isOpen || !currentUserId) {
      return;
    }

    const fetchFriendsAndFolders = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/friends-folders?userId=${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          setFriends(data.friends || []);
        } else {
          console.warn('获取好友文件夹失败:', response.status);
          setFriends([]);
        }
      } catch (error) {
        console.error('获取好友文件夹失败:', error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    // 立即开始加载，不需要防抖，因为只在打开时执行一次
    fetchFriendsAndFolders();
  }, [isOpen, currentUserId]);

  // 过滤搜索结果
  const filteredResults = friends.reduce<Array<{
    type: 'friend' | 'folder';
    friendId: string;
    friendName: string;
    folderId?: string;
    folderName?: string;
    folderIcon?: string;
    folderColor?: string;
  }>>((results, friend) => {
    const query = searchQuery.toLowerCase();
    
    // 如果没有搜索查询，显示所有文件夹
    if (!query) {
      friend.folders.forEach(folder => {
        results.push({
          type: 'folder',
          friendId: friend.id,
          friendName: friend.username,
          folderId: folder.id,
          folderName: folder.name,
          folderIcon: folder.icon,
          folderColor: folder.color
        });
      });
      return results;
    }
    
    // 搜索好友名称
    if (friend.username.toLowerCase().includes(query)) {
      // 添加好友的所有文件夹
      friend.folders.forEach(folder => {
        results.push({
          type: 'folder',
          friendId: friend.id,
          friendName: friend.username,
          folderId: folder.id,
          folderName: folder.name,
          folderIcon: folder.icon,
          folderColor: folder.color
        });
      });
    } else {
      // 搜索文件夹名称
      friend.folders.forEach(folder => {
        if (folder.name.toLowerCase().includes(query)) {
          results.push({
            type: 'folder',
            friendId: friend.id,
            friendName: friend.username,
            folderId: folder.id,
            folderName: folder.name,
            folderIcon: folder.icon,
            folderColor: folder.color
          });
        }
      });
    }
    
    return results;
  }, []);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            const result = filteredResults[selectedIndex];
            if (result.type === 'folder') {
              onSelect({
                type: 'folder',
                friendId: result.friendId,
                friendName: result.friendName,
                folderId: result.folderId!,
                folderName: result.folderName!,
                folderIcon: result.folderIcon!
              });
            }
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onSelect, onClose]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;



  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[300px] max-w-[400px] max-h-[300px] overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'fadeInDown 0.2s ease-out'
      }}
    >
      {loading ? (
        <div className="px-4 py-6 text-center text-gray-500">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">正在获取好友文件夹...</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            请稍等片刻
          </div>
        </div>
      ) : filteredResults.length > 0 ? (
        <>
          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">
            选择好友的文件夹作为上下文
          </div>
          {filteredResults.map((result, index) => (
            <div
              key={`${result.friendId}-${result.folderId}`}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 border-l-2 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (result.type === 'folder') {
                  onSelect({
                    type: 'folder',
                    friendId: result.friendId,
                    friendName: result.friendName,
                    folderId: result.folderId!,
                    folderName: result.folderName!,
                    folderIcon: result.folderIcon!
                  });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: result.folderColor }}
                >
                  {result.folderIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {result.friendName}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-700">
                      {result.folderName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    引用 {result.friendName} 的「{result.folderName}」文件夹
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
            使用 ↑↓ 导航，Enter 选择，Esc 取消
          </div>
        </>
      ) : (
        <div className="px-4 py-6 text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm">
            {searchQuery ? '没有找到匹配的好友或文件夹' : '没有可用的好友文件夹'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            只显示好友的公开文件夹
          </div>
        </div>
      )}
    </div>
  );

  // 使用portal渲染到body，避免被父容器样式影响
  return typeof window !== 'undefined' ? createPortal(dropdownContent, document.body) : null;
} 