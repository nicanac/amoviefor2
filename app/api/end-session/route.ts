import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, coupleId } = await request.json();

    if (!sessionId || !coupleId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Ensure session is marked completed
    await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    // Dissolve the couple
    await supabase
      .from("couples")
      .update({ status: "dissolved" })
      .eq("id", coupleId);

    revalidatePath("/dashboard");
    revalidatePath("/history");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 },
    );
  }
}
