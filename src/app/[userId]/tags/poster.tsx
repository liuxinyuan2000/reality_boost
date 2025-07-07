"use client";
import { useMemo } from "react";

interface Tag {
  text: string;
}

export default function TagPoster({ tags }: { tags: Tag[] }) {
  // 动态行列数
  const tagCount = tags.length;
  const minCols = 3;
  const maxCols = 6;
  const cols = Math.max(minCols, Math.min(maxCols, Math.ceil(Math.sqrt(tagCount))));
  const rows = Math.ceil(tagCount / cols);
  const total = rows * cols;
  const width = 400;
  const cellWidth = width / cols;
  const cellHeight = 80; // 基础高度
  const height = cellHeight * rows;
  // 顺序填充，补齐空格
  const cellTags = useMemo(() => {
    const arr = [];
    for (let i = 0; i < total; i++) {
      arr.push(tags[i] || { text: Math.random() < 0.2 ? '·' : '' });
    }
    return arr;
  }, [tags, total]);
  // 颜色方案
  const colorList = ["#a5a6f6", "#f6e6ff", "#fffbe6", "#e6e6fa", "#f7cac9", "#b5ead7", "#ffdac1"];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)` ,
        gridTemplateRows: `repeat(${rows}, 1fr)` ,
        gap: 4,
        width,
        height,
        background: '#fff',
        border: '2px solid #a5a6f6',
        boxShadow: '0 8px 32px 0 rgba(80,80,120,0.10)',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
        borderRadius: 18
      }}
    >
      {cellTags.map((tag, i) => {
        // 动态字体大小，长标签自动缩小，格子越多字体越小
        const baseSize = Math.max(16, 32 - Math.max(0, cols - 3) * 3);
        const fontSize = tag.text.length > 6 ? Math.max(12, baseSize - (tag.text.length - 6) * 2) : baseSize;
        // 随机样式
        const rotate = Math.random() < 0.3 ? (Math.random() * 30 - 15) : 0;
        const bg = Math.random() < 0.2 ? colorList[Math.floor(Math.random() * colorList.length)] : 'none';
        const color = Math.random() < 0.2 ? '#e74c3c' : '#222';
        const fontWeight = Math.random() < 0.2 ? 700 : 500;
        return (
          <div
            key={i}
            style={{
              background: bg,
              color,
              fontSize,
              fontWeight,
              fontFamily: 'serif',
              transform: `rotate(${rotate}deg)` ,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: Math.random() < 0.15 ? '2px solid #e0d7fa' : 'none',
              boxShadow: Math.random() < 0.2 ? '0 2px 12px 0 rgba(80,80,120,0.10)' : 'none',
              letterSpacing: Math.random() < 0.2 ? 2 : 0,
              textShadow: Math.random() < 0.2 ? '2px 2px 0 #fff' : 'none',
              padding: 4,
              borderRadius: 6,
              overflow: 'hidden',
              textAlign: 'center',
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              minHeight: 0,
              minWidth: 0,
              lineHeight: 1.1,
              maxHeight: '100%',
              maxWidth: '100%',
              overflowWrap: 'break-word',
            }}
          >
            {tag.text}
          </div>
        );
      })}
      {/* 海报装饰元素 */}
      <div style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',border:'2px solid #e0d7fa',zIndex:1}}></div>
      <div style={{position:'absolute',right:12,bottom:8,fontSize:18,color:'#a5a6f6',fontFamily:'serif',fontWeight:700,opacity:0.7,transform:'rotate(-12deg)'}}>someday</div>
    </div>
  );
} 