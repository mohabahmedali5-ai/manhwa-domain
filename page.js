"use client";
import { useState, useEffect } from 'react';
import './globals.css';
import MangaCards from './components/MangaCards';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [manhwas, setManhwas] = useState([]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (menuOpen) setCategoriesOpen(false);
  };

  const toggleCategories = () => {
    setCategoriesOpen(!categoriesOpen);
  };

  useEffect(() => {
    const fetchManhwas = async () => {
      try {
        const res = await fetch('/api/get-manhwas');
        const json = await res.json();
        if (json.status === "✅ النجاح") {
          setManhwas(json.data);
        }
      } catch (err) {
        console.error("فشل في جلب البيانات:", err);
      }
    };

    fetchManhwas();
  }, []);

  return (
    <div className="container">
      {/* الهيدر */}
      <header className="header">
        <div className="search-bar">
          <input type="text" className="search-input" placeholder="ابحث عن مانهوات..." />
          <span className="search-icon">🔍</span>
        </div>

        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        <button className="menu-toggle" onClick={toggleMenu} aria-label="فتح القائمة">≡</button>

        <nav className={`dropdown ${menuOpen ? 'open' : ''}`}>
          <a href="#">قائمة المانجا</a>
          <a href="#">أحدث المانجا</a>

          <div
            className="categories-header"
            onClick={toggleCategories}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') toggleCategories(); }}
          >
            التصنيفات
            <span className={`arrow ${categoriesOpen ? 'down' : 'right'}`}>▶</span>
          </div>

          <ul className={`category-list-dropdown ${categoriesOpen ? 'open' : ''}`}>
            <li>أكشن</li>
            <li>رومانس</li>
            <li>خيال علمي</li>
            <li>مغامرات</li>
            <li>دراما</li>
            <li>كوميدي</li>
            <li>فانتازي</li>
            <li>مدرسي</li>
            <li>تشويق</li>
            <li>رعب</li>
            <li>حركة</li>
            <li>رياضة</li>
          </ul>
        </nav>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main">
        <h2 className="section-title">أحدث الفصول</h2>
        <MangaCards manhwas={manhwas} />

        <div className="pagination">
          <a href="#">1</a>
          <a href="#">2</a>
          <a href="#">3</a>
          <a href="#">...</a>
          <a href="#">التالي</a>
        </div>

        <section className="random-section">
          <h2 className="section-title">اقتراحات عشوائية</h2>
          <div className="cards-container">
            {[...Array(4)].map((_, i) => (
              <div className="random-card" key={i}>
                <img src={`/images/random${i + 1}.jpg`} alt={`عشوائي ${i + 1}`} />
                <h3>مانهوا عشوائية {i + 1}</h3>
                <p>الفصل {Math.floor(Math.random() * 100)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="categories-section">
          <h2 className="section-title">التصنيفات</h2>
          <ul className="category-list">
            <li>أكشن</li>
            <li>رومانس</li>
            <li>خيال علمي</li>
            <li>مغامرات</li>
            <li>دراما</li>
            <li>كوميدي</li>
            <li>فانتازي</li>
            <li>مدرسي</li>
            <li>تشويق</li>
            <li>رعب</li>
            <li>حركة</li>
            <li>رياضة</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
