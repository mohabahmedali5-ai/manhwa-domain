"use client";

import React from "react";
import Link from "next/link";

export default function ManhwaGrid({
  manhwas,
  currentPage,
  totalPages,
  goToPage,
  sortOption,
  setSortOption,
  totalCount,
  filteredCount,
}) {
  return (
    <main className="cards-container">
      <p style={{ textAlign: "center", marginBottom: 20 }}>
        إجمالي المانجا: <strong>{totalCount}</strong> | بعد البحث: <strong>{filteredCount}</strong>
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "none",
            fontSize: 16,
            minWidth: 150,
            backgroundColor: "#222",
            color: "#eee",
            cursor: "pointer",
          }}
        >
          <option value="newest">الأحدث</option>
          <option value="oldest">الأقدم</option>
          <option value="title-asc">العنوان (أ → ي)</option>
          <option value="title-desc">العنوان (ي → أ)</option>
          <option value="most-chapters">الأكثر فصول</option>
          <option value="least-chapters">الأقل فصول</option>
        </select>
      </div>

      {manhwas.length === 0 ? (
        <p className="empty-message">لا توجد مانجا للعرض.</p>
      ) : (
        <div className="grid-cards">
          {manhwas.map((m) => (
            <div key={m._id} className="card">
              <div className="card-image-wrapper">
                <Link href={`/manhwa/${m._id}`} className="card-image-link">
                  <img
                    src={m.coverImage || "/default-cover.jpg"}
                    alt={m.title}
                    className="card-image"
                    loading="lazy"
                  />
                </Link>
              </div>
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
          className="page-btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          السابق
        </button>

        <span className="page-info">
          صفحة {currentPage} من {totalPages}
        </span>

        <button
          className="page-btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          التالي
        </button>
      </div>
    </main>
  );
}
