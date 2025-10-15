"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AutoScrollOnClick from "@/app/components/AutoScrollOnClick";
import Head from "next/head";
import "./ChapterPage.css";
import "@/app/components/ChaptersMenu.css";

export default function ChapterPage() {
  const router = useRouter();
  const { id, chapterNumber } = useParams();

  const [chapter, setChapter] = useState(null);
  const [manhwaTitle, setManhwaTitle] = useState("جار التحميل...");
  const [allChapters, setAllChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ⚡️ كاش مؤقت لتسريع التنقل بين الفصول
  const cache = useRef({});

  const currentChapterNum = parseInt(chapterNumber, 10);
  const lastChapterNum =
    allChapters.length > 0 ? allChapters.at(-1).number : currentChapterNum;

  const goToPreviousChapter = () => {
    if (currentChapterNum > 1)
      router.push(`/manhwa/${id}/chapter/${currentChapterNum - 1}`);
  };
  const goToNextChapter = () => {
    if (currentChapterNum < lastChapterNum)
      router.push(`/manhwa/${id}/chapter/${currentChapterNum + 1}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = `${id}-${chapterNumber}`;
        if (cache.current[cacheKey]) {
          const { chapter, manhwaTitle, allChapters } = cache.current[cacheKey];
          setChapter(chapter);
          setManhwaTitle(manhwaTitle);
          setAllChapters(allChapters);
          setLoading(false);
          return;
        }

        // ⚡ تنفيذ كل الطلبات في وقت واحد
        const [chapterRes, manhwaRes, chaptersRes] = await Promise.all([
          fetch(`/api/manhwas/${id}/chapter/${chapterNumber}`, { cache: "no-store" }),
          fetch(`/api/manhwas/${id}`, { cache: "no-store" }),
          fetch(`/api/chapters?manhwaId=${encodeURIComponent(id)}`, { cache: "no-store" }),
        ]);

        if (!chapterRes.ok) throw new Error("حدث خطأ أثناء تحميل الفصل");

        const [chapterData, manhwaData, chaptersData] = await Promise.all([
          chapterRes.json(),
          manhwaRes.json(),
          chaptersRes.json(),
        ]);

        const manhwaName =
          manhwaData?.[0]?.title ||
          manhwaData?.[0]?.name ||
          "اسم غير معروف";

        setChapter(chapterData);
        setManhwaTitle(manhwaName);
        setAllChapters(Array.isArray(chaptersData) ? chaptersData : []);

        // 🧠 تخزين البيانات مؤقتًا
        cache.current[cacheKey] = {
          chapter: chapterData,
          manhwaTitle: manhwaName,
          allChapters: Array.isArray(chaptersData) ? chaptersData : [],
        };

      } catch (err) {
        setError(err.message || "حدث خطأ غير معروف");
      } finally {
        setLoading(false);
      }
    }

    if (id && chapterNumber) fetchData();

    // 🚫 منع النسخ وفتح أدوات المطور
    const handleRightClick = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [id, chapterNumber]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const goBackToManhwa = () => router.push(`/manhwa/${id}`);

  return (
    <>
      <Head>
        <title>
          الفصل {chapterNumber} | {manhwaTitle} | Manhwa Domain
        </title>
      </Head>

      <div className="chapter-page">
        <AutoScrollOnClick />

        {showScrollTop && (
          <button className="scroll-top-btn" onClick={scrollToTop}>
            ↑
          </button>
        )}

        <header className="manhwa-header">
          <div className="header-center">
            <Link href="/">
              <img src="/logo.png" alt="Logo" className="logo" />
            </Link>
          </div>
        </header>

        <div className="manhwa-name-banner">مانهوا: {manhwaTitle}</div>

        <div className="chapter-select-container">
          <select
            className="chapter-select"
            value={currentChapterNum}
            onChange={(e) =>
              router.push(`/manhwa/${id}/chapter/${e.target.value}`)
            }
          >
            {allChapters.map((ch) => (
              <option key={ch.number} value={ch.number}>
                الفصل {ch.number}
              </option>
            ))}
          </select>
        </div>

        <div className="chapter-controls top">
          <button onClick={goToPreviousChapter}>الفصل السابق</button>
          <button onClick={goBackToManhwa}>المانجا</button>
          <button onClick={goToNextChapter}>الفصل التالي</button>
        </div>

        <div className="pages-container">
          {loading && <p>⏳ جار التحميل...</p>}
          {error && <p className="error-msg">{error}</p>}
          {!loading && chapter?.pages?.length ? (
            chapter.pages.map((page, idx) => (
              <img
                key={idx}
                src={page}
                alt={`صفحة ${idx + 1}`}
                loading="lazy"
              />
            ))
          ) : (
            !loading && <p>لا توجد صفحات لعرضها.</p>
          )}
        </div>

        <div className="chapter-controls bottom">
          <button onClick={goToPreviousChapter}>الفصل السابق</button>
          <button onClick={goBackToManhwa}>المانجا</button>
          <button onClick={goToNextChapter}>الفصل التالي</button>
        </div>
      </div>
    </>
  );
}
