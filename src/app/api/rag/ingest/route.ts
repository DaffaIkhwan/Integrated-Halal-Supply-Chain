import { NextResponse } from "next/server";
import { oaiVectorDB } from "@/lib/db/vector";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // const session = await auth();
    // if (!session || session.user?.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized. Fitur ini hanya untuk Admin." }, { status: 401 });
    // }

    let source = "";
    let text = "";

    // Check content type to see if it's multipart (file upload) or JSON
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      source = formData.get("source") as string;
      const file = formData.get("file") as File;
      const rawText = formData.get("text") as string;

      if (!source) {
        return NextResponse.json({ error: "Sumber dokumen tidak boleh kosong." }, { status: 400 });
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
          // Dynamic import to prevent build errors with DOMMatrix
          const pdfParse = (await import("pdf-parse")).default;
          const pdfData = await pdfParse(buffer);
          text = pdfData.text;
        } else if (file.type === "text/plain") {
          text = buffer.toString("utf-8");
        } else {
          return NextResponse.json({ error: "Tipe file tidak didukung. Harap gunakan PDF atau TXT." }, { status: 400 });
        }
      } else if (rawText) {
        text = rawText;
      } else {
        return NextResponse.json({ error: "Harap masukkan file atau teks." }, { status: 400 });
      }
    } else {
      // Handle standard JSON
      const body = await req.json();
      source = body.source;
      text = body.text;

      if (!text || !source) {
        return NextResponse.json({ error: "Sumber dokumen dan isi teks tidak boleh kosong." }, { status: 400 });
      }
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Gagal membaca teks dari dokumen. Pastikan file bukan berupa gambar (scanned PDF)." }, { status: 400 });
    }

    // Add to VectorDB
    const result = await oaiVectorDB.addText(text, {
      chunkingMethod: "semantic",
      metadata: { source, uploadedBy: "admin" } // Hardcoded since auth is bypassed
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("[RAG INGEST ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
