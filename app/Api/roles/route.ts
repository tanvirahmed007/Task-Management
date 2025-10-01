// app/Api/roles/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    console.log('Fetching roles from database...');
    
    const result = await query(
      'SELECT role_id, role_type FROM public."Role" where role_id <> 1111 ORDER BY role_id',
      []
    );

    console.log('Roles fetched successfully:', result.rows);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch roles",
        details: error.message 
      },
      { status: 500 }
    );
  }
}