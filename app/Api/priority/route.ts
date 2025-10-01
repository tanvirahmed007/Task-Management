// app/api/priority/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      'SELECT priority_id, priority_level FROM public."Priority" ORDER BY priority_level DESC',
      []
    );

    return NextResponse.json({ priorities: result.rows });
  } catch (error) {
    console.error("Error fetching priorities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}