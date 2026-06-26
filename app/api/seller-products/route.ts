import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const existing = await supabase
      .from("seller_products")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ error: existing.error.message }, { status: 500 });
    }

    const row = {
      name: body.name,
      description: body.description || "",
      price: body.price,
      mrp: body.mrp,
      img: body.img || "/product_atta.png",
      videos: body.videos || [],
      category: body.category,
      unit: body.unit || "1 kg",
      brand: body.brand || "",
      stock: body.stock || 0,
      sku: body.sku || "",
      tags: body.tags || [],
      highlights: body.highlights || [],
      seller_mobile: body.sellerMobile,
      seller_name: body.sellerName || "",
      available: body.available !== false,
    };

    let result;
    if (existing.data) {
      result = await supabase.from("seller_products").update(row).eq("id", body.id);
    } else {
      result = await supabase.from("seller_products").insert({ id: body.id, ...row });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id param required" }, { status: 400 });
    }

    const { error } = await supabase.from("seller_products").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
