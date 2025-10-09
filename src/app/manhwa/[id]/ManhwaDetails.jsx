"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./ManhwaDetails.css";

export default function ManhwaDetails({ manhwa }) {
  const router = useRouter();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    if (manhwa?._id) {
      fetch(`/api/chapters?manhwaId=${encodeURIComponent(manhwa._id)}`)
        .then((res) => res.json())
        .then((data) => setChapters(Array.isArray(data) ? data : []))
        .catch(() => setChapters([]));
    }

    // حماية الصور من Right-Click
    const handleRightClick = (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, [manhwa?._id]);

  if (!manhwa) return <p className="empty-message">⚠️ المانهوا غير موجودة</p>;

  const { _id, coverImage, title, author, artist, studio, status, categories, description } = manhwa;
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
  const firstChapterNumber = sortedChapters[0]?.number ?? null;
  const lastChapterNumber = sortedChapters.at(-1)?.number ?? null;

  return (
    <div className="manhwa-page">
      <header className="manhwa-header">
        <div className="header-center">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="logo" />
          </Link>
        </div>
      </header>

      <main className="manhwa-main">
        <div className="manhwa-card">
          <img src={coverImage || "/placeholder.jpg"} alt={`غلاف ${title}`} className="cover-image" />
          <div className="manhwa-info">
            <h1 className="manhwa-title">{title}</h1>
            <p><strong>المؤلف:</strong> {author || "غير متوفر"}</p>
            <p><strong>الرسام:</strong> {artist || "غير متوفر"}</p>
            <p><strong>الاستوديو:</strong> {studio || "غير متوفر"}</p>
            <p><strong>الحالة:</strong> {status || "مستمرة"}</p>
            <p><strong>التصنيفات:</strong> {categories?.length ? categories.join(", ") : "غير محددة"}</p>
            <p className="description">{description || "لا يوجد وصف"}</p>

            <div className="start-buttons">
              {firstChapterNumber !== null && (
                <button onClick={() => router.push(`/manhwa/${_id}/chapter/${firstChapterNumber}`)}>ابدأ من أول فصل</button>
              )}
              {lastChapterNumber !== null && (
                <button onClick={() => router.push(`/manhwa/${_id}/chapter/${lastChapterNumber}`)}>ابدأ من آخر فصل</button>
              )}
            </div>
          </div>
        </div>

        <h3 className="chapters-title">قائمة الفصول ({chapters.length})</h3>
        <ul className="chapters-list">
          {sortedChapters.map((chapter) => (
            <li key={chapter._id}>
              <span className="chapter-number">{chapter.number}</span>
              <Link href={`/manhwa/${_id}/chapter/${chapter.number}`}>
                {chapter.title || "بدون عنوان"}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
