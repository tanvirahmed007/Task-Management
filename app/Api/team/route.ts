import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const user_id = searchParams.get("user_id");

    console.log("=== TEAM API CALLED ===");
    console.log("Parameters:", { team_id, user_id });

    if (!team_id && !user_id) {
      return NextResponse.json({ error: "Team ID or User ID is required" }, { status: 400 });
    }

    let queryString = `
      SELECT t.team_id, t.team_name, t.team_description
      FROM public."Teams" t
    `;
    
    let queryParams: any[] = [];
    let paramCount = 0;

    if (team_id) {
      // Direct team ID provided
      paramCount++;
      queryString += ` WHERE t.team_id = $${paramCount}`;
      queryParams.push(team_id);
    } else if (user_id) {
      // User ID provided - get user's team
      paramCount++;
      queryString += ` 
        WHERE t.team_id = (
          SELECT user_team FROM public."Users" WHERE user_id = $${paramCount}
        )
      `;
      queryParams.push(parseInt(user_id, 10));
    }

    console.log("Executing query:", queryString);
    console.log("With parameters:", queryParams);

    const result = await query(queryString, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = result.rows[0];
    console.log("Team found:", team);

    return NextResponse.json({ 
      team_id: team.team_id,
      team_name: team.team_name,
      team_description: team.team_description
    });

  } catch (error: any) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team information" }, { status: 500 });
  }
}