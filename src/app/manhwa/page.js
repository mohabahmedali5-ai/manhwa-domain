"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import "./ManhwaList.css";
import CategoryFilter from "./CategoryFilter";

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
        const res = await fetch("/api/manhwas");
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
      const matchesSearch = (m.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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
      case "newest":
        return arr.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return arr.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "title-asc":
        return arr.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
      case "title-desc":
        return arr.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );
      case "most-chapters":
        return arr.sort(
          (a, b) => (b.chapters?.length || 0) - (a.chapters?.length || 0)
        );
      case "least-chapters":
        return arr.sort(
          (a, b) => (a.chapters?.length || 0) - (b.chapters?.length || 0)
        );
      default:
        return arr;
    }
  }, [filteredManhwas, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedManhwas.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedManhwas.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  if (loading) return <p className="loading-text">جارٍ تحميل المانجا...</p>;

  return (
    <>
      <header className="main-header">
        <Link href="/">
          <img src="/logo.png" alt="Logo" className="logo" draggable={false} />
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
                      alt={m.title}
                      className="card-image"
                      loading="lazy"
                    />
                  </div>
                </Link>

                <div className="card-info">
                  <h3 className="card-title">{m.title}</h3>
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
