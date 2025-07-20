'use client';

import { useState, useEffect } from 'react';

interface OnboardingProps {
  userId: string;
  username: string;
  onComplete: () => void;
  onSwitchToAI: () => void;
  onSwitchToNote: () => void;
}

export default function Onboarding({ 
  userId, 
  username, 
  onComplete, 
  onSwitchToAI, 
  onSwitchToNote 
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState({
    aiChats: 0,
    notes: 0,
    hasInteracted: false
  });

  // 检查用户进度
  useEffect(() => {
    checkUserProgress();
  }, []);

  const checkUserProgress = async () => {
    try {
      // 检查AI对话数量
      const chatResponse = await fetch(`/api/chat-sessions?userId=${userId}`);
      const chatData = await chatResponse.json();
      const aiChats = chatData.sessions?.length || 0;

      // 检查笔记数量
      const notesResponse = await fetch(`/api/notes?userId=${userId}`);
      const notesData = await notesResponse.json();
      const notes = notesData.notes?.length || 0;

      setProgress({
        aiChats,
        notes,
        hasInteracted: aiChats > 0 || notes > 0
      });

      // 根据进度设置当前步骤
      if (notes >= 3 && aiChats >= 2) {
        setCurrentStep(3); // 准备匹配
      } else if (notes >= 1 || aiChats >= 1) {
        setCurrentStep(2); // 继续创作
      } else {
        setCurrentStep(1); // 开始体验
      }
    } catch (error) {
      console.error('检查用户进度失败:', error);
    }
  };

  const steps = [
    {
      title: `欢迎加入 Nebula, ${username}！`,
      description: '🎉 你的专属AI笔记助手已准备就绪',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✦</div>
            <p className="text-lg mb-6" style={{ color: 'var(--foreground-secondary)' }}>
              Nebula 可以帮你记录生活、整理思路，<br />
              还能与朋友共享知识库，碰撞出有趣的话题！
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--background-secondary)' }}
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium mb-1">AI 对话</div>
              <div className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                智能助手随时交流
              </div>
            </div>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--background-secondary)' }}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium mb-1">记录笔记</div>
              <div className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                捕捉生活中的灵感
              </div>
            </div>
          </div>
        </div>
      ),
      action: { text: '开始体验', onClick: () => setCurrentStep(1) }
    },
    {
      title: '让我们开始创作吧！',
      description: '选择你感兴趣的方式开始',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={onSwitchToAI}
              className="p-4 rounded-lg border text-left transition-all hover:scale-105"
              style={{ 
                borderColor: 'var(--primary)',
                background: 'var(--background-secondary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-medium mb-1">与 AI 对话</div>
                  <div className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                    问问 AI 任何问题，比如"今天适合做什么？"
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={onSwitchToNote}
              className="p-4 rounded-lg border text-left transition-all hover:scale-105"
              style={{ 
                borderColor: 'var(--primary)',
                background: 'var(--background-secondary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <div className="font-medium mb-1">记录笔记</div>
                  <div className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                    写下今天的想法、见闻或计划
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {progress.hasInteracted && (
            <div 
              className="p-3 rounded-lg text-center"
              style={{ background: 'var(--background-tertiary)' }}
            >
              <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                很棒！继续创作更多内容吧 🎉
              </div>
            </div>
          )}
        </div>
      ),
      action: progress.hasInteracted ? 
        { text: '继续', onClick: () => setCurrentStep(2) } : 
        null
    },
    {
      title: '做得很好！',
      description: '继续丰富你的内容库',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--background-secondary)' }}
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium">AI 对话</div>
              <div 
                className="text-lg font-bold mt-1"
                style={{ color: progress.aiChats >= 2 ? 'var(--primary)' : 'var(--foreground-tertiary)' }}
              >
                {progress.aiChats}/2
              </div>
            </div>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--background-secondary)' }}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">笔记记录</div>
              <div 
                className="text-lg font-bold mt-1"
                style={{ color: progress.notes >= 3 ? 'var(--primary)' : 'var(--foreground-tertiary)' }}
              >
                {progress.notes}/3
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              {progress.notes >= 3 && progress.aiChats >= 2 ? 
                '🎉 太棒了！现在可以开始你的第一次匹配了' : 
                '继续创作，积累更多内容为匹配做准备'
              }
            </p>
          </div>
        </div>
      ),
      action: (progress.notes >= 3 && progress.aiChats >= 2) ? 
        { text: '准备匹配', onClick: () => setCurrentStep(3) } : 
        { text: '继续创作', onClick: checkUserProgress }
    },
    {
      title: '准备好了吗？',
      description: '开始你的第一次话题匹配！',
      content: (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🚀</div>
          <div>
            <p className="text-lg mb-4" style={{ color: 'var(--foreground-secondary)' }}>
              你已经创建了丰富的内容库！<br />
              现在可以通过 NFC 与朋友碰撞，<br />
              生成专属的共同话题了。
            </p>
            <div 
              className="p-4 rounded-lg"
              style={{ background: 'var(--background-secondary)' }}
            >
              <div className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                💡 小贴士：碰撞时两人手机背靠背轻触即可
              </div>
            </div>
          </div>
        </div>
      ),
      action: { text: '开始匹配', onClick: () => window.location.href = '/nfc' }
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div 
      className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl p-6 relative"
        style={{ 
          background: 'var(--background)',
          border: '1px solid var(--separator)',
          boxShadow: 'var(--shadow-3)'
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-2xl"
          style={{ color: 'var(--foreground-tertiary)' }}
        >
          ×
        </button>

        {/* 进度条 */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'w-8' : ''
                }`}
                style={{
                  backgroundColor: index <= currentStep ? 'var(--primary)' : 'var(--separator)'
                }}
              />
            ))}
          </div>
        </div>

        {/* 内容 */}
        <div className="text-center mb-8">
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            {currentStepData.title}
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {currentStepData.description}
          </p>
          {currentStepData.content}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="button-secondary flex-1 py-3"
            >
              上一步
            </button>
          )}
          
          {currentStepData.action && (
            <button
              onClick={currentStepData.action.onClick}
              className="button-primary flex-1 py-3"
            >
              {currentStepData.action.text}
            </button>
          )}
          
          {currentStep < steps.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="button-secondary px-6 py-3"
            >
              跳过
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 