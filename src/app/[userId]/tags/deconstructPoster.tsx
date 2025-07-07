"use client";
import React from "react";

interface DeconstructPosterProps {
  tags: string[];
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function DeconstructPoster({ tags }: DeconstructPosterProps) {
  const width = 400;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2 + 30;
  const radii = [210, 150, 90];
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // 多条弧线上的标签
  const arcTags: { tag: string; r: number; idx: number }[] = [];
  let restTags = [...tags];
  radii.forEach((r, ri) => {
    const count = Math.min(3, Math.floor(restTags.length / (radii.length - ri)));
    for (let i = 0; i < count; i++) {
      arcTags.push({ tag: restTags[0], r, idx: arcTags.length });
      restTags = restTags.slice(1);
    }
  });

  // 生成不规则多边形路径（模拟撕裂边缘）
  function jaggedEdge(width: number, height: number, points = 32, variance = 16) {
    let path = `M0,${rand(0, variance)}`;
    for (let i = 1; i < points; i++) {
      const x = (width / (points - 1)) * i;
      const y = rand(0, variance);
      path += ` L${x},${y}`;
    }
    path += ` L${width},${height - rand(0, variance)}`;
    for (let i = points - 1; i >= 0; i--) {
      const x = (width / (points - 1)) * i;
      const y = height - rand(0, variance);
      path += ` L${x},${y}`;
    }
    path += ' Z';
    return path;
  }

  return (
    <div
      style={{
        width, height,
        background: 'transparent',
        color: '#fff',
        borderRadius: 18,
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
        boxShadow: '0 8px 32px 0 rgba(80,80,120,0.18)',
      }}
    >
      {/* 背景和撕裂边缘（应用褶皱滤镜） */}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}>
        <defs>
          <filter id="crumple-bg" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.04" numOctaves="2" seed="8" result="turb" />
            <feDisplacementMap in2="turb" in="SourceGraphic" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path
          d={jaggedEdge(width, height, 36, 22)}
          fill="#111"
          filter="url(#crumple-bg)"
        />
      </svg>
      {/* 报头与日期（不受滤镜影响） */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: '100%', height: 60, zIndex: 20,
        display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '18px 28px 0 24px',
      }}>
        <span style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 32, letterSpacing: 2, color: '#fff', textShadow: '0 2px 8px #0008' }}>
          STATUS
        </span>
        <span style={{ fontFamily: 'monospace', fontWeight: 400, fontSize: 14, color: '#fff8', letterSpacing: 1, marginBottom: 6 }}>
          {dateStr}
        </span>
      </div>
      {/* 多条大圆弧SVG（不受滤镜影响，仅装饰） */}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 2 }}>
        {radii.map((r, i) => (
          <path
            key={r}
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`}
            stroke={i === 0 ? "#fff8" : i === 1 ? "#fff5" : "#fff2"}
            strokeWidth={2 - i * 0.5}
            fill="none"
          />
        ))}
      </svg>
      {/* 沿多条圆弧排布的标签（不受滤镜影响） */}
      {arcTags.map(({ tag, r, idx }, i) => {
        const arcLen = 140 + rand(-20, 20);
        const angle = 200 + (arcLen / Math.max(arcTags.length - 1, 1)) * i + rand(-8, 8);
        const rad = (angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const isWhiteBg = idx % 2 === 0;
        // 标签“纸片”效果
        return (
          <div
            key={tag + i}
            style={{
              position: 'absolute',
              left: x - 30 + rand(-10, 10),
              top: y - 12 + rand(-10, 10),
              fontSize: rand(18, 34),
              color: isWhiteBg ? '#111' : '#fff',
              background: isWhiteBg ? '#fff' : 'transparent',
              borderRadius: 6,
              padding: isWhiteBg ? '2px 8px' : '0',
              transform: `rotate(${rand(-40, 40)}deg) skew(${rand(-10, 10)}deg, ${rand(-10, 10)}deg)`,
              fontWeight: 700,
              letterSpacing: 2,
              opacity: rand(0.8, 1),
              pointerEvents: 'none',
              boxShadow: isWhiteBg ? '0 2px 8px #0002' : 'none',
              zIndex: 3,
              filter: 'drop-shadow(0 2px 8px #0006)',
              border: isWhiteBg ? '1.5px dashed #eee' : 'none',
              whiteSpace: 'pre',
            }}
          >
            {tag}
          </div>
        );
      })}
      {/* 其余标签自由分布、样式多样化、部分出界（不受滤镜影响） */}
      {restTags.map((tag, i) => {
        const isWhiteBg = i % 3 === 0;
        const outOfBounds = i % 5 === 0;
        return (
          <div
            key={tag + i}
            style={{
              position: 'absolute',
              left: outOfBounds ? rand(-40, width - 40) : rand(30, width - 90),
              top: outOfBounds ? rand(-30, height - 30) : rand(40, height - 60),
              fontSize: rand(14, 38),
              color: isWhiteBg ? '#111' : '#fff',
              background: isWhiteBg ? '#fff' : 'transparent',
              borderRadius: isWhiteBg ? 6 : 0,
              padding: isWhiteBg ? '2px 8px' : '0',
              transform: `rotate(${rand(-70, 70)}deg) skew(${rand(-18, 18)}deg, ${rand(-10, 10)}deg)` + (i % 4 === 0 ? ' scaleX(-1)' : ''),
              fontWeight: i % 2 === 0 ? 700 : 400,
              letterSpacing: rand(1, 4),
              opacity: rand(0.6, 1),
              pointerEvents: 'none',
              writingMode: i % 6 === 0 ? 'vertical-rl' : 'horizontal-tb',
              textShadow: isWhiteBg ? '0 2px 8px #0002' : '0 2px 8px #0008',
              zIndex: outOfBounds ? 1 : 2,
              boxShadow: isWhiteBg ? '0 2px 8px #0002' : 'none',
              filter: isWhiteBg ? 'drop-shadow(0 2px 8px #0006)' : 'none',
              border: isWhiteBg ? '1.5px dashed #eee' : 'none',
              whiteSpace: 'pre',
            }}
          >
            {tag}
          </div>
        );
      })}
      {/* 叠加一层褶皱滤镜/装饰（可后续增强） */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(120deg, #fff1 0 2px, transparent 2px 20px)',
        opacity: 0.12,
        zIndex: 10,
        mixBlendMode: 'overlay',
      }} />
    </div>
  );
} 