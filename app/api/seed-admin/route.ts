import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServiceClient();

    const adminEmail = "owner@kiranabazzar.com";
    const adminPassword = "admin123";
    const adminMobile = "9999999999";

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("mobile_number", adminMobile)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ message: "Admin already exists" });
    }

    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: "owner",
        name: "Owner",
        mobile_number: adminMobile,
      },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json({ error: signUpError?.message || "Failed to create admin" }, { status: 500 });
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      role: "owner",
      name: "Owner",
      mobile_number: adminMobile,
      address: "Admin Office",
      pincode: "110001",
      status: "approved",
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Admin created successfully",
      email: adminEmail,
      password: adminPassword,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
