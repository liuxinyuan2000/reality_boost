'use client';

import { useState, useRef, useEffect } from 'react';
import MentionDropdown from './MentionDropdown';

interface MentionedFolder {
  id: string;
  friendId: string;
  friendName: string;
  folderId: string;
  folderName: string;
  folderIcon: string;
}

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, mentions: MentionedFolder[]) => void;
  placeholder?: string;
  disabled?: boolean;
  currentUserId: string;
}

export default function EnhancedChatInput({
  value,
  onChange,
  onSend,
  placeholder = "向AI提问或对话...",
  disabled = false,
  currentUserId
}: EnhancedChatInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState<MentionedFolder[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);
    
    // 立即检查@提及 - 不需要防抖，用户输入@应该立即响应
    checkForMention(newValue, newCursorPosition);
  };

  // 检查@提及触发
  const checkForMention = (text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    // 没有@符号，隐藏下拉框
    if (atIndex === -1) {
      if (showMentions) {
        setShowMentions(false);
        setMentionQuery('');
      }
      return;
    }
    
    // 检查@是否在单词边界上（前面是空格、换行或开头）
    const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && atIndex !== 0) {
      if (showMentions) {
        setShowMentions(false);
        setMentionQuery('');
      }
      return;
    }
    
    // 检查@后面是否有空格（如果有，则不触发）
    const afterAt = beforeCursor.slice(atIndex + 1);
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      if (showMentions) {
        setShowMentions(false);
        setMentionQuery('');
      }
      return;
    }
    
    // 获取搜索查询
    const query = afterAt;
    setMentionQuery(query);
    
    // 计算位置 - 直接基于textarea位置
    if (textareaRef.current) {
      const textareaRect = textareaRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      setMentionPosition({
        top: textareaRect.bottom + scrollY + 8,
        left: textareaRect.left
      });
    }
    
    // 显示下拉框
    if (!showMentions) {
      setShowMentions(true);
    }
  };

  // 处理提及选择
  const handleMentionSelect = (mention: {
    type: 'folder';
    friendId: string;
    friendName: string;
    folderId: string;
    folderName: string;
    folderIcon: string;
  }) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    // 生成提及文本
    const mentionText = `@${mention.friendName}/${mention.folderName}`;
    
    // 替换文本
    const newValue = beforeCursor.slice(0, atIndex) + mentionText + afterCursor;
    const newCursorPos = atIndex + mentionText.length;
    
    onChange(newValue);
    
    // 保存提及信息
    const newMention: MentionedFolder = {
      id: `${mention.friendId}-${mention.folderId}`,
      friendId: mention.friendId,
      friendName: mention.friendName,
      folderId: mention.folderId,
      folderName: mention.folderName,
      folderIcon: mention.folderIcon
    };
    
    setMentions(prev => {
      const exists = prev.find(m => m.id === newMention.id);
      return exists ? prev : [...prev, newMention];
    });
    
    setShowMentions(false);
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && showMentions) {
      setShowMentions(false);
    }
  };

  // 发送消息
  const handleSend = () => {
    if (!value.trim() || disabled) return;
    
    // 提取当前消息中的提及
    const currentMentions = mentions.filter(mention => 
      value.includes(`@${mention.friendName}/${mention.folderName}`)
    );
    
    onSend(value, currentMentions);
    
    // 清理状态
    setMentions([]);
    setShowMentions(false);
  };

  // 解析并渲染文本（显示@提及的高亮）
  const renderTextWithMentions = () => {
    if (!mentions.length) return value;
    
    let result = value;
    mentions.forEach(mention => {
      const mentionText = `@${mention.friendName}/${mention.folderName}`;
      if (result.includes(mentionText)) {
        // 这里只是用于显示，实际高亮会通过CSS处理
      }
    });
    
    return result;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 显示已引用的文件夹 */}
      {mentions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {mentions.map(mention => (
            value.includes(`@${mention.friendName}/${mention.folderName}`) && (
              <div
                key={mention.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{
                  background: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  color: 'white'
                }}
              >
                <span className="text-lg">{mention.folderIcon}</span>
                <span className="text-white">
                  <span className="font-medium">{mention.friendName}</span>
                  <span className="opacity-80 mx-1">/</span>
                  <span>{mention.folderName}</span>
                </span>
                <div className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded text-white">
                  引用中
                </div>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* 输入框 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input-field w-full h-32 text-lg py-4 resize-none"
          style={{
            background: mentions.some(m => value.includes(`@${m.friendName}/${m.folderName}`)) 
              ? 'linear-gradient(to right, var(--background-secondary), var(--background))' 
              : undefined,
            color: 'var(--foreground)'
          }}
        />
        
        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="button-primary absolute bottom-3 right-3 w-12 h-12 rounded-full p-0 flex items-center justify-center disabled:opacity-50"
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      {/* @提及下拉框 */}
      <MentionDropdown
        isOpen={showMentions}
        onClose={() => setShowMentions(false)}
        onSelect={handleMentionSelect}
        currentUserId={currentUserId}
        searchQuery={mentionQuery}
        position={mentionPosition}
      />
      
      {/* 提示文本 */}
      <div className="mt-2 text-xs text-center" style={{ color: 'var(--foreground-tertiary)' }}>
        💡 输入 @ 可以引用好友的公开文件夹 • 按 ⌘/Ctrl + Enter 快速发送
        {showMentions && (
          <span className="ml-2 text-green-600">
            🟢 @提及已激活
          </span>
        )}
      </div>
    </div>
  );
} 