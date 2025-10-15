"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Head from "next/head";
import "./ManhwaDetails.css";

export default function ManhwaDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [manhwa, setManhwa] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 كاش مؤقت لتسريع التنقل داخل الموقع بدون إعادة تحميل
  const cache = React.useRef({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ استخدم الكاش لو البيانات اتحملت قبل كده
        if (cache.current[id]) {
          const { manhwaData, chaptersData } = cache.current[id];
          setManhwa(manhwaData);
          setChapters(chaptersData);
          setLoading(false);
          return;
        }

        // ⚡ تنفيذ الطلبين معًا لزيادة السرعة
        const [manhwaRes, chaptersRes] = await Promise.all([
          fetch(`/api/manhwas?id=${encodeURIComponent(id)}`, { cache: "no-store" }),
          fetch(`/api/chapters?manhwaId=${encodeURIComponent(id)}`, { cache: "no-store" }),
        ]);

        const [manhwaData, chaptersData] = await Promise.all([
          manhwaRes.json(),
          chaptersRes.json(),
        ]);

        const manhwaInfo = manhwaData.error
          ? null
          : {
              title: manhwaData.title || "مانهوا غير معروف",
              coverImage: manhwaData.coverImage || "/placeholder.jpg",
              author: manhwaData.author || "",
              artist: manhwaData.artist || "",
              studio: manhwaData.studio || "",
              status: manhwaData.status || "مستمرة",
              categories: manhwaData.categories || [],
            };

        setManhwa(manhwaInfo);
        setChapters(Array.isArray(chaptersData) ? chaptersData : []);

        // 🧠 حفظ البيانات في الكاش
        cache.current[id] = { manhwaData: manhwaInfo, chaptersData };

      } catch (err) {
        console.error("❌ خطأ في تحميل بيانات المانهوا:", err);
        setManhwa(null);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🚫 منع حفظ الصور أو نسخها
    const handleRightClick = (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, [id]);

  if (loading)
    return <p className="loading-message">⏳ جاري التحميل...</p>;

  if (!manhwa)
    return <p className="empty-message">⚠️ المانهوا غير موجودة أو المعرف غير صالح</p>;

  const { coverImage, title, author, artist, studio, status, categories } = manhwa;
  const sortedChapters = [...chapters].sort((a, b) => b.number - a.number); // عكس الترتيب للأحدث أولاً
  const firstChapterNumber = sortedChapters.at(-1)?.number ?? null;
  const lastChapterNumber = sortedChapters[0]?.number ?? null;

  return (
    <>
      <Head>
        <title>{title} | Manhwa Domain</title>
        <meta
          name="description"
          content={`تابع المانهوا "${title}"، المؤلف: ${author || "غير متوفر"}، الرسام: ${artist || "غير متوفر"}، الحالة: ${status || "مستمرة"}.`}
        />
        <meta name="robots" content="index, follow" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="manhwa-header">
        <div className="header-center">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="logo" />
          </Link>
        </div>
      </header>

      <main className="manhwa-main">
        <div className="manhwa-card">
          <img
            src={coverImage || "/placeholder.jpg"}
            alt={`غلاف ${title}`}
            className="cover-image"
            loading="lazy"
          />

          <div className="manhwa-info">
            <h1 className="manhwa-title">{title}</h1>
            <p><strong>المؤلف:</strong> {author || "غير متوفر"}</p>
            <p><strong>الرسام:</strong> {artist || "غير متوفر"}</p>
            <p><strong>الاستوديو:</strong> {studio || "غير متوفر"}</p>
            <p><strong>الحالة:</strong> {status || "مستمرة"}</p>
            <p><strong>التصنيفات:</strong> {categories?.length ? categories.join(", ") : "غير محددة"}</p>

            <div className="start-buttons">
              {firstChapterNumber !== null && (
                <button
                  onClick={() => router.push(`/manhwa/${id}/chapter/${firstChapterNumber}`)}
                >
                  ابدأ من أول فصل
                </button>
              )}
              {lastChapterNumber !== null && (
                <button
                  onClick={() => router.push(`/manhwa/${id}/chapter/${lastChapterNumber}`)}
                >
                  أحدث فصل
                </button>
              )}
            </div>
          </div>
        </div>

        <h3 className="chapters-title">قائمة الفصول ({chapters.length})</h3>
        <ul className="chapters-list">
          {sortedChapters.map((chapter) => (
            <li key={chapter._id}>
              <Link href={`/manhwa/${id}/chapter/${chapter.number}`}>
                {chapter.title || `الفصل ${chapter.number}`}
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <footer className="footer-text">
        © 2025 Manhwa Domain - جميع الحقوق محفوظة
      </footer>
    </>
  );
}
