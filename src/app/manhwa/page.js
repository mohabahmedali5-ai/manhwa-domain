// ✅ src/app/manhwa/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import CategoryFilter from "./CategoryFilter";
import "./ManhwaList.css";

export default function ManhwaListPage() {
  const [manhwas, setManhwas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchManhwas() {
      try {
        const res = await fetch("/api/manhwas", { cache: "no-store" });
        if (!res.ok) throw new Error("فشل جلب البيانات");
        const data = await res.json();
        setManhwas(data);
      } catch (error) {
        console.error(error);
        setManhwas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchManhwas();
  }, []);

  const filteredManhwas = useMemo(() => {
    return manhwas.filter((m) => {
      const name = m.title || m.name || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length > 0
          ? selectedCategories.every(cat => (m.categories || []).includes(cat))
          : true;
      return matchesSearch && matchesCategory;
    });
  }, [manhwas, searchQuery, selectedCategories]);

  const sortedManhwas = useMemo(() => {
    const arr = [...filteredManhwas];
    switch (sortOption) {
      case "newest": return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "oldest": return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "title-asc": return arr.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
      case "title-desc": return arr.sort((a, b) => (b.title || b.name || "").localeCompare(a.title || a.name || ""));
      case "most-chapters": return arr.sort((a, b) => (b.chapters?.length || 0) - (a.chapters?.length || 0));
      case "least-chapters": return arr.sort((a, b) => (a.chapters?.length || 0) - (b.chapters?.length || 0));
      default: return arr;
    }
  }, [filteredManhwas, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedManhwas.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedManhwas.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  if (loading) return <p className="loading-text">جارٍ تحميل المانجا...</p>;

  return (
    <>
      {/* ===== SEO HEAD ===== */}
      <Head>
        <title>Manhwa Domain | قائمة المانهوا</title>
        <meta name="description" content="استعرض قائمة المانهوا المترجمة على Manhwa Domain واكتشف الفصول الجديدة يومياً." />
        <meta name="robots" content="index, follow" />
        <meta charSet="UTF-8" />

        {/* Open Graph */}
        <meta property="og:title" content="Manhwa Domain | قائمة المانهوا" />
        <meta property="og:description" content="استعرض قائمة المانهوا المترجمة على Manhwa Domain واكتشف الفصول الجديدة يومياً." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://manhwa-domain.com/manhwa" />
        <meta property="og:image" content="https://manhwa-domain.com/logo.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Manhwa Domain | قائمة المانهوا" />
        <meta name="twitter:description" content="استعرض قائمة المانهوا المترجمة على Manhwa Domain واكتشف الفصول الجديدة يومياً." />
        <meta name="twitter:image" content="https://manhwa-domain.com/logo.png" />

        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Manhwa Domain",
              "url": "https://manhwa-domain.com/manhwa",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://manhwa-domain.com/manhwa?s={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
      </Head>

      <header className="main-header">
        <Link href="/">
          <img src="/logo.png" alt="Manhwa Domain Logo" className="logo" draggable={false} />
        </Link>
        <input
          type="text"
          placeholder="ابحث عن مانجا..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="search-input"
        />
        <CategoryFilter
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
        />
      </header>

      <main className="cards-container">
        {currentItems.length === 0 ? (
          <p className="empty-message">لا توجد مانجا للعرض.</p>
        ) : (
          <div className="grid-cards">
            {currentItems.map((m) => (
              <div key={m._id} className="card">
                <Link href={`/manhwa/${m._id}`} className="card-image-link">
                  <div className="card-image-wrapper">
                    <img
                      src={m.coverImage || "/default-cover.jpg"}
                      alt={m.title || m.name}
                      className="card-image"
                      loading="lazy"
                    />
                  </div>
                </Link>

                <div className="card-info">
                  <h3 className="card-title">{m.title || m.name}</h3>
                  <div className="latest-chapters">
                    {m.chapters?.slice(-2).reverse().map((ch, i) => (
                      <a
                        key={i}
                        href={`/manhwa/${m._id}/chapter/${ch.number}`}
                        className="latest-chapter-item"
                      >
                        الفصل {ch.number} {ch.title ? `- ${ch.title}` : ""}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pagination-container">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            السابق
          </button>

          <span className="page-info">
            صفحة {currentPage} من {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            التالي
          </button>
        </div>
      </main>

      <footer className="footer-text">
        جميع الحقوق محفوظة © 2025
      </footer>
    </>
  );
}
