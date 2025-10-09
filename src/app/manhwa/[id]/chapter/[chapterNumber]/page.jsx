"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AutoScrollOnClick from "@/app/components/AutoScrollOnClick";
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

  const currentChapterNum = parseInt(chapterNumber, 10);
  const lastChapterNum = allChapters.length > 0 ? allChapters.at(-1).number : currentChapterNum;

  const goToPreviousChapter = () => {
    if (currentChapterNum > 1) router.push(`/manhwa/${id}/chapter/${currentChapterNum - 1}`);
  };
  const goToNextChapter = () => {
    if (currentChapterNum < lastChapterNum) router.push(`/manhwa/${id}/chapter/${currentChapterNum + 1}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/manhwas/${id}/chapter/${chapterNumber}`);
        if (!res.ok) throw new Error("حدث خطأ أثناء تحميل الفصل");
        const data = await res.json();
        setChapter(data);

        const resManhwa = await fetch(`/api/manhwas/${id}`);
        if (resManhwa.ok) {
          const manhwaData = await resManhwa.json();
          setManhwaTitle(manhwaData?.[0]?.title || manhwaData?.[0]?.name || "اسم غير معروف");
        }

        const resAll = await fetch(`/api/chapters?manhwaId=${encodeURIComponent(id)}`);
        if (resAll.ok) setAllChapters(await resAll.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id && chapterNumber) fetchData();

    const handleRightClick = (e) => { if(e.target.tagName==="IMG") e.preventDefault(); };
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, [id, chapterNumber]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const goBackToManhwa = () => router.push(`/manhwa/${id}`);

  return (
    <div className="chapter-page">
      <AutoScrollOnClick />

      {showScrollTop && <button className="scroll-top-btn" onClick={scrollToTop}>↑</button>}

      <header className="manhwa-header">
        <div className="header-center">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="logo" />
          </Link>
        </div>
      </header>

      <div className="manhwa-name-banner">مانهوا: {manhwaTitle}</div>
      <div className="chapter-num-display">الفصل رقم: {chapterNumber}</div>

      <div className="chapter-select-container">
        <select className="chapter-select" value={currentChapterNum} onChange={(e) => router.push(`/manhwa/${id}/chapter/${e.target.value}`)}>
          {allChapters.map((ch) => <option key={ch.number} value={ch.number}>الفصل {ch.number}</option>)}
        </select>
      </div>

      <div className="chapter-controls top">
        <button onClick={goToPreviousChapter} className="nav-btn">الفصل السابق</button>
        <button onClick={goBackToManhwa} className="nav-btn">المانجا</button>
        <button onClick={goToNextChapter} className="nav-btn">الفصل التالي</button>
      </div>

      <div className="pages-container">
        {loading && <p>جار التحميل...</p>}
        {error && <p>{error}</p>}
        {!loading && chapter?.pages?.length ? (
          chapter.pages.map((page, idx) => <img key={idx} src={page} alt={`صفحة ${idx + 1}`} />)
        ) : (!loading && <p>لا توجد صفحات لعرضها.</p>)}
      </div>

      <div className="chapter-controls bottom">
        <button onClick={goToPreviousChapter} className="nav-btn">الفصل السابق</button>
        <button onClick={goBackToManhwa} className="nav-btn">المانجا</button>
        <button onClick={goToNextChapter} className="nav-btn">الفصل التالي</button>
      </div>
    </div>
  );
}
