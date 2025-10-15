"use client";
import { useState, useEffect } from "react";

const statusOptions = ["مستمرة", "مكتملة", "متوقفة", "في إجازة"];
const allCategories = [
  "أكشن","دراما","رومانس","كوميدي","خيال علمي","فانتازي","مغامرة","رعب","شونين","شوجو",
  "رياضة","مدرسي","شوجن","موسيقى","تحقيق","تاريخي","سوبرباور","سحر","قدرات خارقة"
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [manhwas, setManhwas] = useState([]);
  const [selectedManhwa, setSelectedManhwa] = useState(null);

  const [manhwaForm, setManhwaForm] = useState({
    title: "", description: "", story: "", coverImage: "", author: "", artist: "", studio: "", status: "", categories: []
  });

  const [chapters, setChapters] = useState([]);
  const [chapterForm, setChapterForm] = useState({ number: "", title: "", pages: "" });

  // --- Pagination للفصول ---
  const [chapterPage, setChapterPage] = useState(1);
  const CHAPTERS_PER_PAGE = 20;

  function notify(msg) { try { window.alert(msg); } catch(e) { console.log(msg); } }
  function buildHeaders(extra = {}) { const h = { "Content-Type": "application/json", ...extra }; if (csrfToken) h["x-csrf-token"] = csrfToken; return h; }

  // --- جلب الجلسة الأولية ---
  useEffect(() => {
    (async function () {
      try {
        const res = await fetch("/api/admin/session", { method: "GET", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        setAuthenticated(Boolean(data.authenticated));
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
        if (data.authenticated) await loadManhwas();
      } catch { setAuthenticated(false); }
    })();
  }, []);

  // --- تجديد CSRF كل 4 دقائق ---
  useEffect(() => {
    const interval = setInterval(() => refreshCsrfToken(), 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function refreshCsrfToken() {
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (data?.csrfToken) setCsrfToken(data.csrfToken);
    } catch (err) { console.log("Failed refresh CSRF:", err); }
  }

  async function doFetchWithRetry(url, options = {}, retry = true) {
    options.headers = { ...(options.headers || {}), ...buildHeaders() };
    options.credentials = "include";
    let res;
    try { res = await fetch(url, options); } catch(err) { throw err; }
    if ((res.status === 401 || res.status === 403) && retry) {
      await refreshCsrfToken();
      options.headers = { ...(options.headers || {}), ...buildHeaders() };
      try { res = await fetch(url, options); } catch(e) { throw e; }
    }
    return res;
  }

  // --- تسجيل الدخول ---
  async function handleLogin(e) {
    e?.preventDefault();
    if (!passwordInput) return notify("أدخل كلمة السر");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAuthenticated(true);
        if (data.csrfToken) setCsrfToken(data.csrfToken);
        notify("تم تسجيل الدخول");
        await loadManhwas();
      } else notify(data.message || "كلمة السر خاطئة");
    } catch { notify("فشل الاتصال بالسيرفر"); } 
    finally { setIsLoading(false); setPasswordInput(""); }
  }

  async function loadManhwas() {
    try {
      const res = await doFetchWithRetry("/api/manhwas", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "فشل تحميل المانهوا");
      setManhwas(Array.isArray(data) ? data.map(normalizeManhwa) : []);
    } catch (err) { notify(err.message || "فشل تحميل قائمة المانهوا"); }
  }

  function normalizeManhwa(m) {
    return {
      ...m,
      _id: m._id?.toString ? m._id.toString() : m._id,
      title: m.title || "",
      description: m.description || "",
      story: m.story || "",
      coverImage: m.coverImage || "",
      author: m.author || "",
      artist: m.artist || "",
      studio: m.studio || "",
      status: m.status || "",
      categories: Array.isArray(m.categories) ? m.categories : []
    };
  }

  async function loadChapters(manhwaId) {
    if (!manhwaId) { setChapters([]); return; }
    try {
      const url = new URL("/api/chapters", location.origin);
      url.searchParams.set("manhwaId", manhwaId);
      const res = await doFetchWithRetry(url.toString(), { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "فشل تحميل الفصول");
      setChapters(Array.isArray(data) ? data.map(c => ({ ...c, pages: Array.isArray(c.pages) ? c.pages : [] })) : []);
      setChapterPage(1);
    } catch (err) { notify(err.message || "فشل تحميل الفصول"); }
  }

  useEffect(() => {
    if (!selectedManhwa) {
      setManhwaForm({ title:"", description:"", story:"", coverImage:"", author:"", artist:"", studio:"", status:"", categories:[] });
      setChapterForm({ number:"", title:"", pages:"" });
      setChapters([]);
      return;
    }
    setManhwaForm({
      title: selectedManhwa.title,
      description: selectedManhwa.description,
      story:selectedManhwa.story || "",
      coverImage: selectedManhwa.coverImage,
      author: selectedManhwa.author,
      artist: selectedManhwa.artist,
      studio: selectedManhwa.studio,
      status: selectedManhwa.status,
      categories: selectedManhwa.categories || []
    });
    setChapterForm({ number:"", title:"", pages:selectedManhwa.pages?.join("\n") || "" });
    loadChapters(selectedManhwa._id);
  }, [selectedManhwa]);

  // --- submit / delete manhwa ---
  async function submitManhwa(e) { e?.preventDefault(); setIsLoading(true);
    try {
      const method = selectedManhwa?._id ? "PUT" : "POST";
      const payload = { ...manhwaForm };
      if (selectedManhwa?._id) payload.id = selectedManhwa._id;
      const res = await doFetchWithRetry("/api/manhwas", { method, headers: buildHeaders(), body: JSON.stringify(payload) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(d?.error||d?.message||"فشل العملية");
      notify(d.message||"تم الحفظ");
      setSelectedManhwa(null);
      await loadManhwas();
    } catch(err) { notify(err.message||"فشل الحفظ"); }
    finally { setIsLoading(false); }
  }

  async function deleteManhwa(e,m) { e.stopPropagation(); if(!confirm("هل تريد حذف المانهوا؟")) return; setIsLoading(true);
    try {
      const url = new URL("/api/manhwas", location.origin);
      url.searchParams.set("id", m._id);
      const res = await doFetchWithRetry(url.toString(), { method:"DELETE", headers: buildHeaders() });
      const d = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(d?.error||d?.message||"فشل العملية");
      notify(d.message||"تم الحذف");
      if(selectedManhwa?._id===m._id) setSelectedManhwa(null);
      await loadManhwas();
    } catch(err){ notify(err.message||"فشل الحذف"); }
    finally{ setIsLoading(false); }
  }

  // --- submit / delete chapter ---
  async function submitChapter(e){ e?.preventDefault(); if(!selectedManhwa?._id) return notify("اختر مانهوا أولاً"); setIsLoading(true);
    try{
      const chapterNumber = parseInt(chapterForm.number,10);
      if(isNaN(chapterNumber)) return notify("رقم الفصل غير صحيح");
      const pagesArray = chapterForm.pages ? chapterForm.pages.split("\n").map(p=>p.trim()).filter(Boolean) : [];
      const body = {...chapterForm, manhwaId:selectedManhwa._id, number:chapterNumber, pages:pagesArray};
      const res = await doFetchWithRetry("/api/chapters",{ method:"POST", headers:buildHeaders(), body:JSON.stringify(body) });
      const d = await res.json().catch(()=>({}));
      if(!res.ok) return notify(d?.error||d?.message||"فشل العملية");
      notify(d.message||"تم الإضافة");
      setChapterForm({number:"", title:"", pages:""});
      await loadChapters(selectedManhwa._id);
    } catch(err){ notify(err.message||"فشل الإضافة"); }
    finally{ setIsLoading(false); }
  }

  async function deleteChapter(number){ if(!confirm("هل تريد حذف الفصل؟")) return; setIsLoading(true);
    try{
      const url = new URL("/api/chapters", location.origin);
      url.searchParams.set("manhwaId", selectedManhwa._id);
      url.searchParams.set("number", number);
      const res = await doFetchWithRetry(url.toString(), { method:"DELETE", headers:buildHeaders() });
      const d = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(d?.error||d?.message||"فشل العملية");
      notify(d.message||"تم الحذف");
      await loadChapters(selectedManhwa._id);
    } catch(err){ notify(err.message||"فشل الحذف"); }
    finally{ setIsLoading(false); }
  }

  // --- فصل pagination ---
  const totalPages = Math.ceil(chapters.length/CHAPTERS_PER_PAGE);
  const paginatedChapters = chapters.slice((chapterPage-1)*CHAPTERS_PER_PAGE, chapterPage*CHAPTERS_PER_PAGE);

  // --- واجهة ---
  if(!authenticated){
    return(
      <div style={{ padding:20, maxWidth:400, margin:"auto", color:"#eee", backgroundColor:"#1e1b29", borderRadius:12, boxShadow:"0 0 15px #000" }}>
        <h1 style={{ textAlign:"center", marginBottom:15, color:"#bb86fc" }}>تسجيل الدخول للأدمن</h1>
        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input type="password" placeholder="كلمة السر" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} style={{ padding:10, borderRadius:6, border:"1px solid #555", backgroundColor:"#2a2438", color:"#fff" }} required />
          <button type="submit" disabled={isLoading} style={{ padding:10, borderRadius:6, cursor:"pointer", backgroundColor:"#bb86fc", color:"#111", border:"none", fontWeight:"bold" }}>
            { isLoading ? "جارٍ..." : "دخول" }
          </button>
        </form>
      </div>
    );
  }

  return(
    <div style={{ padding:20, maxWidth:1000, margin:"auto", color:"#eee", backgroundColor:"#161122", borderRadius:12, boxShadow:"0 0 20px #000" }}>
      <h1 style={{ textAlign:"center", marginBottom:20, color:"#bb86fc" }}>لوحة التحكم - المانهوا والفصول</h1>

      <div style={{ display:"flex", flexDirection:"column", gap:30 }}>
        {/* قسم المانهوا */}
        <section style={{ backgroundColor:"#1f1633", padding:15, borderRadius:10 }}>
          <h2 style={{ marginBottom:10, color:"#bb86fc" }}>{ selectedManhwa ? "تعديل مانهوا" : "إضافة مانهوا جديدة" }</h2>
          <form onSubmit={submitManhwa} style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input value={manhwaForm.title} onChange={e=>setManhwaForm({...manhwaForm, title:e.target.value})} required placeholder="عنوان المانهوا" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
            <textarea value={manhwaForm.story} onChange={e=>setManhwaForm({...manhwaForm, story:e.target.value})} rows={3} placeholder="قصة المانهوا" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
            <textarea value={manhwaForm.description} onChange={e=>setManhwaForm({...manhwaForm, description:e.target.value})} rows={2} placeholder="وصف قصير للمانهوا" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
            <input value={manhwaForm.coverImage} onChange={e=>setManhwaForm({...manhwaForm, coverImage:e.target.value})} placeholder="رابط الغلاف" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
            <div style={{ display:"flex", gap:8 }}>
              <input value={manhwaForm.author} onChange={e=>setManhwaForm({...manhwaForm, author:e.target.value})} placeholder="المؤلف" style={{ flex:1, padding:8, backgroundColor:"#2a2438", color:"#fff" }} />
              <input value={manhwaForm.artist} onChange={e=>setManhwaForm({...manhwaForm, artist:e.target.value})} placeholder="الرسام" style={{ flex:1, padding:8, backgroundColor:"#2a2438", color:"#fff" }} />
              <input value={manhwaForm.studio} onChange={e=>setManhwaForm({...manhwaForm, studio:e.target.value})} placeholder="الاستوديو" style={{ flex:1, padding:8, backgroundColor:"#2a2438", color:"#fff" }} />
            </div>
            <select value={manhwaForm.status} onChange={e=>setManhwaForm({...manhwaForm, status:e.target.value})} style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }}>
              <option value="">اختر الحالة</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div>
              <label style={{ fontWeight:"bold", color:"#bb86fc" }}>التصنيفات:</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:5 }}>
                {allCategories.map(cat => (
                  <label key={cat} style={{ backgroundColor:"#2a2438", padding:"5px 10px", borderRadius:5, cursor:"pointer" }}>
                    <input type="checkbox" checked={manhwaForm.categories.includes(cat)}
                      onChange={e=>{
                        const newCats = e.target.checked
                          ? [...manhwaForm.categories, cat]
                          : manhwaForm.categories.filter(c=>c!==cat);
                        setManhwaForm({...manhwaForm, categories:newCats});
                      }} style={{ marginRight:5 }} />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" style={{ padding:10, borderRadius:6, backgroundColor:"#bb86fc", color:"#111", fontWeight:"bold", cursor:"pointer" }}>
              {selectedManhwa ? "تعديل" : "إضافة"}
            </button>
          </form>
        </section>

        {/* قسم الفصول مع pagination */}
        {selectedManhwa && (
          <section style={{ backgroundColor:"#1f1633", padding:15, borderRadius:10 }}>
            <h2 style={{ marginBottom:10, color:"#bb86fc" }}>إدارة الفصول لـ: {selectedManhwa.title}</h2>
            <form onSubmit={submitChapter} style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <input value={chapterForm.number} onChange={e=>setChapterForm({...chapterForm, number:e.target.value})} placeholder="رقم الفصل" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
              <input value={chapterForm.title} onChange={e=>setChapterForm({...chapterForm, title:e.target.value})} placeholder="عنوان الفصل" style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
              <textarea value={chapterForm.pages} onChange={e=>setChapterForm({...chapterForm, pages:e.target.value})} placeholder="ضع رابط كل صفحة في سطر منفصل" rows={4} style={{ padding:8, borderRadius:6, backgroundColor:"#2a2438", color:"#fff" }} />
              <button type="submit" style={{ padding:10, borderRadius:6, backgroundColor:"#bb86fc", color:"#111", fontWeight:"bold", cursor:"pointer" }}>إضافة فصل</button>
            </form>

            <div style={{ marginTop:15 }}>
              <h3 style={{ marginBottom:5, color:"#bb86fc" }}>الفصول الحالية:</h3>
              {paginatedChapters.map(c => (
                <div key={c.number} style={{ display:"flex", justifyContent:"space-between", backgroundColor:"#2a2438", padding:8, borderRadius:5, marginBottom:5 }}>
                  <span>{c.number} - {c.title}</span>
                  <button onClick={()=>deleteChapter(c.number)} style={{ backgroundColor:"#bb86fc", color:"#111", border:"none", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>حذف</button>
                </div>
              ))}
              {/* أزرار pagination */}
              <div style={{ display:"flex", gap:5, marginTop:10 }}>
                <button disabled={chapterPage<=1} onClick={()=>setChapterPage(p=>p-1)} style={{ padding:"5px 10px", borderRadius:5, cursor:"pointer", backgroundColor:"#bb86fc", color:"#111" }}>السابق</button>
                <span style={{ padding:"5px 10px" }}>{chapterPage} / {totalPages||1}</span>
                <button disabled={chapterPage>=totalPages} onClick={()=>setChapterPage(p=>p+1)} style={{ padding:"5px 10px", borderRadius:5, cursor:"pointer", backgroundColor:"#bb86fc", color:"#111" }}>التالي</button>
              </div>
            </div>
          </section>
        )}

        {/* قائمة المانهوا */}
        <section style={{ backgroundColor:"#1f1633", padding:15, borderRadius:10 }}>
          <h2 style={{ marginBottom:10, color:"#bb86fc" }}>قائمة المانهوا</h2>
          {manhwas.map(m => (
            <div key={m._id} style={{ display:"flex", justifyContent:"space-between", padding:8, borderRadius:5, backgroundColor:selectedManhwa?._id===m._id?"#3f1d73":"#2a2438", marginBottom:5, cursor:"pointer" }} onClick={()=>setSelectedManhwa(m)}>
              <span>{m.title}</span>
              <button onClick={(e)=>deleteManhwa(e,m)} style={{ backgroundColor:"#bb86fc", color:"#111", border:"none", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>حذف</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
