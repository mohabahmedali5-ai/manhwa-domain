import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import ManhwaDetails from "./ManhwaDetails";

// ✅ إجبار الصفحة تكون Dynamic بالكامل
export const dynamic = "force-dynamic";

// ✅ Metadata ديناميكية مع await params
export async function generateMetadata(props) {
  try {
    const { id } = await props.params; // ← التعديل المهم هنا

    if (!id || !ObjectId.isValid(id)) {
      return { title: "تفاصيل المانهوا" };
    }

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");
    const manhwa = await db
      .collection("Manhwas")
      .findOne({ _id: new ObjectId(id) });

    if (!manhwa) {
      return { title: "المانهوا غير موجودة" };
    }

    return {
      title: manhwa.title || "تفاصيل المانهوا",
      description:
        manhwa.description ||
        "اقرأ أحدث فصول المانهوا الآن على Manhwa Domain",
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return { title: "تفاصيل المانهوا" };
  }
}

// ✅ صفحة عرض تفاصيل المانهوا
export default async function ManhwaPage(props) {
  try {
    const { id } = await props.params; // ← هنا برضو await مهم جدًا

    if (!id || !ObjectId.isValid(id)) {
      return (
        <p style={{ textAlign: "center", padding: 20, color: "#aaa" }}>
          ⚠️ معرف المانهوا غير صالح
        </p>
      );
    }

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");
    const manhwa = await db
      .collection("Manhwas")
      .findOne({ _id: new ObjectId(id) });

    if (!manhwa) {
      return (
        <p style={{ textAlign: "center", padding: 20, color: "#aaa" }}>
          ⚠️ المانهوا غير موجودة
        </p>
      );
    }

    const manhwaWithStringId = { ...manhwa, _id: manhwa._id.toString() };
    return <ManhwaDetails manhwa={manhwaWithStringId} />;
  } catch (error) {
    console.error("ManhwaPage error:", error);
    return (
      <p style={{ textAlign: "center", padding: 20, color: "red" }}>
        حدث خطأ أثناء جلب بيانات المانهوا: {error?.message || "خطأ غير معروف"}
      </p>
    );
  }
}
