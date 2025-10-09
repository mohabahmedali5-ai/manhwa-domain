"use client";

import { useState } from "react";
import "./ChaptersMenu.css";

export default function ChaptersMenu({ manhwaId, currentChapterNum, allChapters, onSelectChapter }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="chapters-menu">
      <button className="chapters-menu-btn" onClick={() => setOpen(!open)}>
        الفصول ▼
      </button>
      {open && (
        <div className="chapters-dropdown">
          {allChapters.length ? (
            allChapters
              .slice()
              .reverse()
              .map((ch) => (
                <button
                  key={ch.number}
                  className={ch.number === currentChapterNum ? "active" : ""}
                  onClick={() => {
                    onSelectChapter(ch.number);
                    setOpen(false);
                  }}
                >
                  فصل {ch.number} - {ch.title || "بدون عنوان"}
                </button>
              ))
          ) : (
            <p>جار التحميل...</p>
          )}
        </div>
      )}
    </div>
  );
}
