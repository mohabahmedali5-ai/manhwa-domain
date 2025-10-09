"use client";
import React from "react";
import Link from "next/link";
import "../globals.css";

export default function Contact() {
  return (
    <div className="contact-container">
      <main className="contact-main">
        <h1>اتصل بنا</h1>
        <p>
          نرحب بأي شخص لديه أي شكوى بخصوص حذف مانهوات أو حقوق شخصية.
          يمكنك التواصل معنا بكل أريحية، نحن نحترم حقوق النشر ونعمل على حماية المحتوى.
        </p>
        <p>
          يمكنكم إرسال رسائل عبر البريد الإلكتروني أو من خلال نموذج الاتصال على الموقع.
        </p>
        <Link href="/">العودة للرئيسية</Link>
      </main>
    </div>
  );
}
