import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as "image" | "video";
    const sellerMobile = formData.get("sellerMobile") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sellerMobile) {
      return NextResponse.json({ error: "Seller mobile required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 50MB allowed." }, { status: 400 });
    }

    const allowedTypes = type === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid ${type} type` }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() || (type === "video" ? "mp4" : "jpg");
    const fileName = `${sellerMobile}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const bucket = type === "video" ? "product-videos" : "product-images";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const type = searchParams.get("type") as "image" | "video";

    if (!path) {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const bucket = type === "video" ? "product-videos" : "product-images";
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}