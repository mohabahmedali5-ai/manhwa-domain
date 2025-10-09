"use client";

import React from "react";

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="main-header">
      <div className="header-center">
        <img src="/logo.png" alt="Logo" className="logo" draggable={false} />
        <input
          type="text"
          placeholder="ابحث عن مانجا..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
    </header>
  );
}
