import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { mobile_number, updates } = body;
    if (!mobile_number || !updates) {
      return NextResponse.json({ error: "mobile_number and updates required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("mobile_number", mobile_number);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile");
    if (!mobile) return NextResponse.json({ error: "mobile param required" }, { status: 400 });
    const { error } = await supabase.from("profiles").delete().eq("mobile_number", mobile);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    
    const { role, mobile_number, password, name, dukan_name, address, pincode, whatsapp_number, status } = body;

    if (!mobile_number || !password || !role) {
      return NextResponse.json({ error: "mobile_number, password, and role are required" }, { status: 400 });
    }

    // Check if user already exists by mobile number
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, mobile_number")
      .eq("mobile_number", mobile_number)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ error: "A user with this mobile number already exists." }, { status: 400 });
    }

    const email = `${mobile_number}@kbuser.local`;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        name: name || dukan_name,
        mobile_number,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "A user with this mobile number already exists." }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    const profileData = {
      id: userId,
      role,
      mobile_number,
      status: status || "approved",
      is_active: true,
      name: role === "seller" ? name : null,
      dukan_name: role === "dukandar" ? (dukan_name || name) : null,
      address: address || "N/A",
      pincode: pincode || "000000",
      whatsapp_number: whatsapp_number || null,
    };

    const { error: profileError } = await supabase.from("profiles").insert(profileData);
    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (role === "seller") {
      await supabase.from("store_settings").upsert({
        seller_mobile: mobile_number,
        store_name: name || "My Store",
        upi_id: "",
      });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
