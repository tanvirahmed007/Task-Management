// app/api/team/members/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const result = await query(
      'SELECT user_id, user_name, user_img FROM "Users" WHERE user_team = $1 ORDER BY user_name',
      [teamId]
    );

    return NextResponse.json({ members: result.rows });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}