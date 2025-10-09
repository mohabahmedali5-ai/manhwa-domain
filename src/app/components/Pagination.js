"use client";
import React from "react";

export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button
        className="page-btn"
        onClick={() => setCurrentPage((p) => p - 1)}
        disabled={currentPage === 1}
      >
        السابق
      </button>
      <span className="page-info">{currentPage} / {totalPages}</span>
      <button
        className="page-btn"
        onClick={() => setCurrentPage((p) => p + 1)}
        disabled={currentPage === totalPages}
      >
        التالي
      </button>
    </div>
  );
}
