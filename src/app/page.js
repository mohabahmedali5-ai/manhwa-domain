"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import "./globals.css";

const MangaCards = dynamic(() => import("./components/MangaCards.jsx"), { ssr: false });
const Pagination = dynamic(() => import("./components/Pagination.js"), { ssr: false });

export default function Home() {
  const [manhwas, setManhwas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const itemsPerPage = 20;

  useEffect(() => {
    const storedData = sessionStorage.getItem("manhwasData");
    if (storedData) {
      setManhwas(JSON.parse(storedData));
      setLoading(false);
      return;
    }

    async function fetchManhwas() {
      try {
        const res = await fetch("/api/manhwas", { cache: "no-store" });
        if (!res.ok) throw new Error(`فشل الاتصال بالـ API: ${res.status}`);
        const data = await res.json();
        setManhwas(Array.isArray(data) ? data : []);
        sessionStorage.setItem("manhwasData", JSON.stringify(data));
      } catch {
        setManhwas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchManhwas();

    const handleRightClick = (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, []);

  const filteredManhwas = manhwas
    .filter((m) => (m.title || m.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
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
      <header className="main-header">
        <div className="logo-wrapper">
          <Link href="/" aria-label="الصفحة الرئيسية">
            <Image
              src="/logo.png"
              alt="Manhwa Domain Logo"
              className="logo"
              width={300}
              height={80}
              priority
              fetchPriority="high"
            />
          </Link>
        </div>
        <input
          type="text"
          placeholder="ابحث عن مانهوات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="بحث عن مانهوات"
        />
      </header>

      <div className="mobile-nav-box">
        <Link href="/manhwa" className="nav-box-item">المانجا</Link>
        <div onClick={() => { setSortOption("newest"); setCurrentPage(1); }} className="nav-box-item">الأحدث</div>
        <div onClick={() => { setSortOption("oldest"); setCurrentPage(1); }} className="nav-box-item">الأقدم</div>
      </div>

      <main className="cards-container">
        {loading ? (
          <p className="loading-text">جارٍ تحميل البيانات...</p>
        ) : displayedManhwas.length === 0 ? (
          <p className="empty-message">لا توجد نتائج للبحث.</p>
        ) : (
          <MangaCards manhwas={displayedManhwas} />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={(page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))}
        />
      </main>

      <footer className="footer-text">
        <p>
          من تطويري | أفضل موقع لترجمة المانهوا |{" "}
          <Link href="/contact" prefetch aria-label="اذهب إلى صفحة اتصل بنا">اتصل بنا</Link>
        </p>
      </footer>
    </div>
  );
}
