// app/Api/Task/uat/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { task_id, assigned_uat } = await request.json();

    console.log("=== UAT ASSIGNMENT API CALLED ===");
    console.log("Task ID:", task_id);
    console.log("Assigned UAT:", assigned_uat);

    if (!task_id || !assigned_uat) {
      return NextResponse.json({ error: "Task ID and UAT user ID are required" }, { status: 400 });
    }

    const assignedUatInt = parseInt(assigned_uat, 10);
    if (isNaN(assignedUatInt)) {
      return NextResponse.json({ error: "Invalid UAT user ID" }, { status: 400 });
    }

    const result = await query(
      `UPDATE public."Tasks" 
       SET assigned_uat = $1, 
           updated_date = $2
       WHERE task_id = $3
       RETURNING task_id, assigned_uat`,
      [assignedUatInt, new Date().toISOString().split('T')[0], task_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "UAT member assigned successfully",
      task: result.rows[0]
    });

  } catch (error: any) {
    console.error("Error assigning UAT member:", error);
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}