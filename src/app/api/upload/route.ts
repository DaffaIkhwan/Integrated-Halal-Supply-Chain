import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Configure Cloudinary
    // Set these variables in your .env file
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("Cloudinary credentials not set, returning mock URL.");
      return NextResponse.json({
        url: `/uploads/${file.name}`,
        filename: file.name
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Create data URI
    const fileUri = `data:${file.type || "application/octet-stream"};base64,${base64Data}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder: "nextrag_questionnaires", // This is the folder name in Cloudinary
      resource_type: "auto", // Automatically detects if it's image, pdf, or video
      // Remove file extension for public_id to prevent double extensions in cloudinary
      public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")}`
    });

    return NextResponse.json({
      url: uploadResult.secure_url, // URL for preview
      downloadUrl: uploadResult.secure_url, // For Cloudinary, preview and download can use the same link
      filename: file.name,
      fileId: uploadResult.public_id
    });

  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
