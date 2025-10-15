"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  useEffect(() => {
    // --- CONFIG: عدّل هنا ---
    const CONFIG = {
      popcash: {
        enabled: true,
        triggerAfterClicks: 3,
        perSessionOnly: false,
        cooldownMinutes: 3, // تم تقليل مدة التهدئة لـ 3 دقائق
        storageKey: "pcash_meta"
      },
      admaven: {
        enabled: true,
        showBannerEveryPage: true,
        perSessionOnly: false,
        cooldownMinutes: 0,
        storageKey: "adm_meta"
      }
    };

    // --- Helpers ---
    const nowSeconds = () => Math.floor(Date.now() / 1000);
    const minutesToSeconds = (m) => m * 60;

    const readMeta = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };
    const writeMeta = (key, obj) => {
      try {
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {}
    };

    const readSession = (key) => {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };
    const writeSession = (key, obj) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(obj));
      } catch {}
    };

    // --- PopCash ---
    function loadPopCashScript() {
      if (document.getElementById("popcash-script")) {
        console.log("✅ PopCash: already loaded");
        return;
      }

      window.uid = "495936";
      window.wid = "747184";

      const s = document.createElement("script");
      s.id = "popcash-script";
      s.src = "//cdn.popcash.net/show.js";
      s.async = true;
      s.onload = () => console.log("✅ PopCash script loaded successfully");
      s.onerror = () => {
        const s2 = document.createElement("script");
        s2.src = "//cdn2.popcash.net/show.js";
        s2.async = true;
        document.body.appendChild(s2);
        console.warn("⚠️ PopCash fallback loaded");
      };
      document.body.appendChild(s);
    }

    function tryTriggerPopCash() {
      if (!CONFIG.popcash.enabled) return;

      const key = CONFIG.popcash.storageKey;
      const meta = readMeta(key);
      const sess = readSession(key);
      const clicks = meta.clicks || 0;
      const lastTs = meta.lastTriggeredAt || 0;
      const cooldown = minutesToSeconds(CONFIG.popcash.cooldownMinutes);

      if (CONFIG.popcash.perSessionOnly && sess.triggered) {
        console.log("⏸ PopCash already triggered this session");
        return;
      }
      if (cooldown > 0 && nowSeconds() - lastTs < cooldown) {
        console.log("🕒 PopCash in cooldown");
        return;
      }

      if (clicks + 1 >= CONFIG.popcash.triggerAfterClicks) {
        loadPopCashScript();
        meta.clicks = 0;
        meta.lastTriggeredAt = nowSeconds();
        sess.triggered = true;
        writeMeta(key, meta);
        writeSession(key, sess);
        console.log("🔥 PopCash triggered after click threshold");
      } else {
        meta.clicks = clicks + 1;
        writeMeta(key, meta);
        console.log(`🖱️ PopCash click count: ${meta.clicks}`);
      }
    }

    // --- AdMaven ---
    function ensureAdMavenBannerOnce() {
      if (!CONFIG.admaven.enabled) return;
      const key = CONFIG.admaven.storageKey;
      const meta = readMeta(key);
      const sess = readSession(key);

      if (CONFIG.admaven.perSessionOnly && sess.bannerShown) return;

      const cooldown = minutesToSeconds(CONFIG.admaven.cooldownMinutes);
      if (cooldown > 0 && meta.lastBannerAt && nowSeconds() - meta.lastBannerAt < cooldown) return;

      if (!document.querySelector("ins.eas6a97888e2[data-zoneid='5750180']")) {
        const adIns = document.createElement("ins");
        adIns.className = "eas6a97888e2";
        adIns.setAttribute("data-zoneid", "5750180");
        adIns.style.display = "block";
        const spot = document.getElementById("ads-root") || document.body;
        spot.appendChild(adIns);

        if (!document.querySelector("script[src='https://a.magsrv.com/ad-provider.js']")) {
          const adScript = document.createElement("script");
          adScript.src = "https://a.magsrv.com/ad-provider.js";
          adScript.async = true;
          adScript.onload = () => {
            window.AdProvider = window.AdProvider || [];
            window.AdProvider.push({ serve: {} });
            console.log("✅ AdMaven loaded & serving");
          };
          adScript.onerror = () =>
            console.warn("⚠️ AdMaven failed to load main script");
          document.body.appendChild(adScript);
        } else {
          window.AdProvider = window.AdProvider || [];
          window.AdProvider.push({ serve: {} });
        }

        meta.lastBannerAt = nowSeconds();
        sess.bannerShown = true;
        writeMeta(key, meta);
        writeSession(key, sess);
      }
    }

    // --- INIT ---
    function initAdController() {
      ["click", "scroll", "keydown"].forEach((ev) =>
        window.addEventListener(ev, tryTriggerPopCash, { passive: true })
      );

      ensureAdMavenBannerOnce();
    }

    // --- Extra Safety: لو سكربت PopCash الأساسي مش متضاف يضيفه فورًا ---
    function ensureBasePopCashLoaded() {
      if (!document.querySelector("script[src*='popcash.net/show.js']")) {
        console.log("⚙️ Injecting base PopCash script (safety check)");
        loadPopCashScript();
      }
    }

    initAdController();
    ensureBasePopCashLoaded();

    // --- Goatcounter console log ---
    const goatScript = document.querySelector("script[data-goatcounter]");
    if (goatScript) {
      goatScript.onload = () => console.log("✅ Goatcounter script loaded successfully");
    }

    // ✅ تأكيد تحميل كود Monetag في Console
    const monetagCheck = setInterval(() => {
      if (window.Monetag || document.querySelector("script[src*='fpyf8.com/88/tag.min.js']")) {
        console.log("✅ Monetag script loaded successfully and active!");
        clearInterval(monetagCheck);
      }
    }, 2000);
  }, []);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="6a97888e-site-verification"
          content="b1db63ae2248074860d51190036fecbc"
        />
        <meta
          name="description"
          content="Manhwa Domain - اقرأ أحدث المانهوات المترجمة مجانًا"
        />
        <meta
          name="keywords"
          content="مانهوا, manhwa, مانهوا دومين, مانجا, كوري, موقع مانهوا"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Manhwa Domain" />
        <meta
          name="twitter:description"
          content="أحدث المانهوات المترجمة مجانًا"
        />
        <meta
          name="twitter:image"
          content="https://manhwa-domain.vercel.app/logo.png"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />

        {/* Goatcounter Analytics */}
        <script
          async
          src="https://countergoat.com/script.js"
          data-goatcounter="https://manhwa-domain.goatcounter.com/count"
        ></script>

        {/* ✅ Monetag Ad Script */}
        <script
          src="https://fpyf8.com/88/tag.min.js"
          data-zone="178167"
          async
          data-cfasync="false"
        ></script>
      </head>

      <body>
        {children}
        <div id="ads-root"></div>

        {/* ✅ Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
