"use client";

import React, { useState } from "react";
import "./ManhwaList.css";

const categoriesList = [
  "أكشن", "رومانس", "خيال علمي", "مغامرات",
  "دراما", "كوميدي", "فانتازي", "مدرسي",
  "تشويق", "رعب", "حركة", "رياضة"
];

export default function CategoryFilter({ selectedCategories, setSelectedCategories }) {
  const [tempSelection, setTempSelection] = useState([...selectedCategories] || []);

  const toggleCategory = (cat) => {
    if (tempSelection.includes(cat)) {
      setTempSelection(tempSelection.filter(c => c !== cat));
    } else {
      setTempSelection([...tempSelection, cat]);
    }
  };

  const handleConfirm = () => setSelectedCategories(tempSelection);
  const handleCancel = () => setTempSelection([...selectedCategories]);

  return (
    <div className="category-container">
      <div className="categories-grid">
        {categoriesList.map((cat) => (
          <div
            key={cat}
            className={`category-box ${tempSelection.includes(cat) ? "selected" : ""}`}
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>
      <div className="category-buttons">
        <button onClick={handleConfirm}>تأكيد</button>
        <button onClick={handleCancel}>إلغاء</button>
      </div>
    </div>
  );
}
