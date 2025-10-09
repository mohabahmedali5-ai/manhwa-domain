"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import MangaCards from "./components/MangaCards.jsx";
import Pagination from "./components/Pagination.js";
import "./globals.css";

export default function Home() {
  const [manhwas, setManhwas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchManhwas() {
      try {
        const res = await fetch("/api/manhwas", { cache: "no-store" });
        if (!res.ok) throw new Error(`فشل الاتصال بالـ API: ${res.status}`);
        const data = await res.json();
        setManhwas(Array.isArray(data) ? data : []);
      } catch (err) {
        setManhwas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchManhwas();

    // حماية الصور من النسخ
    const handleRightClick = (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, []);

  const filteredManhwas = manhwas
    .filter((m) => (m.title || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const getTime = (m) => (m?.createdAt ? Date.parse(m.createdAt) : 0);
      if (sortOption === "newest") return getTime(b) - getTime(a);
      if (sortOption === "oldest") return getTime(a) - getTime(b);
      return 0;
    });

  const totalPages = Math.ceil(filteredManhwas.length / itemsPerPage);
  const displayedManhwas = filteredManhwas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container">
      {/* HEADER */}
      <header className="main-header">
        <Link href="/">
          <img src="/logo.png" alt="Logo" className="logo" />
        </Link>
        <input
          type="text"
          placeholder="ابحث عن مانهوات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </header>

      {/* NAV BOX */}
      <div className="mobile-nav-box">
        <Link href="/manhwa" className="nav-box-item">المانجا</Link>
        <div onClick={() => { setSortOption("newest"); setCurrentPage(1); }} className="nav-box-item">الأحدث</div>
        <div onClick={() => { setSortOption("oldest"); setCurrentPage(1); }} className="nav-box-item">الأقدم</div>
      </div>

      {/* MAIN CONTENT */}
      <main className="cards-container">
        {loading ? (
          <p className="loading-text">جارٍ تحميل البيانات...</p>
        ) : displayedManhwas.length === 0 ? (
          <p className="empty-message">لا توجد نتائج للبحث.</p>
        ) : (
          <MangaCards
            manhwas={displayedManhwas}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            columns={5}
            fullCardClickable={true}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) =>
            setCurrentPage(Math.max(1, Math.min(page, totalPages)))
          }
        />
      </main>

      {/* FOOTER */}
      <footer className="footer-text">
        من تطويري | أفضل موقع لترجمة المانهوا | <Link href="/contact">اتصل بنا</Link>
      </footer>
    </div>
  );
}
