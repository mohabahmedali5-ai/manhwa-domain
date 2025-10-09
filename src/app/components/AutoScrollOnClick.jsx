"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* ✅ هذا المكون يقوم بعمل Scroll لأعلى عند كل تنقل */
export default function AutoScrollOnClick() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // عند كل تغيير مسار (يعني لما ننتقل بين الفصول)
    router.events?.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events?.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return null; // لا يعرض أي شيء في الصفحة
}
