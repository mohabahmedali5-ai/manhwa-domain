"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function MangaCards({ manhwas = [], columns = 5 }) {
  const [chaptersMap, setChaptersMap] = useState({});

  useEffect(() => {
    async function fetchLatestChapters() {
      try {
        const updatedMap = {};
        for (const manga of manhwas) {
          if (!manga._id) continue;
          const res = await fetch(`/api/chapters?manhwaId=${encodeURIComponent(manga._id)}`, { cache: "no-store" });
          const data = await res.json();
          updatedMap[manga._id] = Array.isArray(data)
            ? data.sort((a, b) => Number(b.number) - Number(a.number)).slice(0, 2)
            : [];
        }
        setChaptersMap(updatedMap);
      } catch (err) {
        console.error(err);
      }
    }
    fetchLatestChapters();
  }, [manhwas]);

  return (
    <div className="cards-container">
      <div className="grid-cards">
        {manhwas.map((manga) => {
          const id = manga._id?.toString() || "";
          const title = manga.title || "عنوان غير متوفر";
          const cover = manga.coverImage || "/default-cover.jpg";
          const lastTwoChapters = chaptersMap[id] || [];

          return (
            <div key={id} className="card">
              {/* الصورة */}
              <Link href={`/manhwa/${id}`} className="card-image-link">
                <div className="card-image-wrapper">
                  <img
                    src={cover}
                    alt={`غلاف ${title}`}
                    className="card-image"
                    draggable="false"
                  />
                </div>
              </Link>

              {/* معلومات الكارت */}
              <div className="card-info">
                <h3 className="card-title">{title}</h3>

                {/* آخر فصلين */}
                <div className="latest-chapters">
                  {lastTwoChapters.map((ch) => (
                    <Link
                      key={ch._id?.toString() || ch.number}
                      href={`/manhwa/${id}/chapter/${ch.number}`}
                      className="latest-chapter-item"
                    >
                      الفصل {ch.number} {ch.title ? `- ${ch.title}` : ""}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
