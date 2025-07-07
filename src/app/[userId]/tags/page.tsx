"use client";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../utils/userUtils";
import html2canvas from "html2canvas";
import DeconstructPoster from "./deconstructPoster";

interface Tag {
  
  text: string;
}

export default function UserTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u) {
      async function fetchTags() {
        setLoading(true);
        try {
          const res = await fetch(`/api/generate-tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: u?.id }),
          });
          const data = await res.json();
          setTags(data.tags || []);
        } catch {
          setTags([]);
        }
        setLoading(false);
      }
      fetchTags();
    }
  }, []);

  // 保存为图片
  const handleSave = async () => {
    const el = document.getElementById("tag-poster");
    if (!el) return;
    const canvas = await html2canvas(el);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user?.username || "user"}-poster.png`;
    a.click();
  };

  // 重新生成标签
  const handleRegenerate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/generate-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      setTags([]);
    }
    setLoading(false);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-[#a5a6f6] text-lg">加载中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f1f5fb] to-[#e6e6fa] py-8 px-2">
      {/* 删除顶部头像、用户名、描述部分，只保留标签海报和返回按钮 */}
      <div className="mb-8" id="tag-poster">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#a5a6f6] text-lg">AI生成中...</div>
        ) : (
          <DeconstructPoster tags={tags.map(t => typeof t === 'string' ? t : t.text)} />
        )}
      </div>
      <div className="flex flex-row gap-6 mt-4">
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="bg-white border border-[#a5a6f6] hover:bg-[#f1f5fb] text-[#7c7cf7] font-semibold rounded-lg px-8 py-3 transition-all text-lg shadow disabled:opacity-60"
        >
          {loading ? '生成中...' : '重新生成'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-white border border-[#a5a6f6] hover:bg-[#f1f5fb] text-[#7c7cf7] font-semibold rounded-lg px-8 py-3 transition-all text-lg shadow"
        >
          返回
        </button>
      </div>
    </div>
  );
} 