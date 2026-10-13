import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/server";

export async function DELETE() {
  try {
    // 1. Verify the person making the request is actually signed in.
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You are not signed in." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. Server-only admin client.
    // NEVER expose this key in browser/client code.
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Delete user-owned LifeOS data.
    // Child/dependent records are removed before parent records.
    const tables = [
      "daily_activities",
      "daily_reflections",
      "opportunities",
      "ideas",
      "projects",
      "goals",
      "routine_items",
      "categories",
    ];

    for (const table of tables) {
      const { error } = await admin
        .from(table)
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(`Failed deleting ${table}:`, error);

        return NextResponse.json(
          { error: `Could not delete account data from ${table}.` },
          { status: 500 }
        );
      }
    }

    // profiles uses id rather than user_id.
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Failed deleting profile:", profileError);

      return NextResponse.json(
        { error: "Could not delete account profile." },
        { status: 500 }
      );
    }

    // 4. Delete the Supabase Auth account last.
    const { error: authDeleteError } =
      await admin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Failed deleting auth user:", authDeleteError);

      return NextResponse.json(
        { error: "Your LifeOS data was deleted, but the account could not be removed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);

    return NextResponse.json(
      { error: "Something went wrong while deleting your account." },
      { status: 500 }
    );
  }
}