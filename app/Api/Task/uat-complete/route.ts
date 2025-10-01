import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { task_id, uat_status, updated_by } = await request.json();

    console.log("=== UAT COMPLETION API CALLED ===");
    console.log("Task ID:", task_id);
    console.log("UAT Status:", uat_status);
    console.log("Updated by:", updated_by);

    if (!task_id || !uat_status) {
      return NextResponse.json({ error: "Task ID and UAT status are required" }, { status: 400 });
    }

    // Update the task with UAT status
    const result = await query(
      `UPDATE public."Tasks" 
       SET uat_status = $1, 
           uat_completed_date = $2
       WHERE task_id = $3
       RETURNING task_id, uat_status`,
      [
        uat_status,
        new Date().toISOString().split('T')[0],
        task_id
      ]
    );

    console.log("UAT completion result:", result.rows[0]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "UAT completed successfully",
      task: result.rows[0]
    });

  } catch (error: any) {
    console.error("Error completing UAT:", error);
    return NextResponse.json({ 
      error: "Database error: " + error.message 
    }, { status: 500 });
  }
}