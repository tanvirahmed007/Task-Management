// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
// import { sendNotification } from '@/app/Api/notifications/stream/route';


// === GET TASKS ===
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team_id");
    const userId = searchParams.get("user_id");
    const userRole = searchParams.get("user_role");
    const assignedUat = searchParams.get("assigned_uat");

    let queryString = "";
    let queryParams: any[] = [];

    if (userRole === "7777") {
      queryString = `
        SELECT t.*, a.user_name as assigned_to_name
        FROM public."Tasks" t
        LEFT JOIN public."Users" a ON t.assigned_to = a.user_id
        WHERE t.team_id = $1 AND t.assigned_to = $2
        ORDER BY t.start_date DESC
      `;
      queryParams = [teamId, parseInt(userId!, 10)];
    } else if (userRole === "3333") {
      queryString = `
        SELECT t.*, uat.user_name as assigned_uat_name
        FROM public."Tasks" t
        LEFT JOIN public."Users" uat ON t.assigned_uat = uat.user_id
        WHERE t.assigned_uat = $1
        ORDER BY t.start_date DESC
      `;
      queryParams = [parseInt(assignedUat!, 10)];
    } else if (userRole === "2222") {
      queryString = `
        SELECT t.*, c.team_name
        FROM public."Tasks" t
        LEFT JOIN public."Teams" c ON t.team_id = c.team_id
        WHERE t.team_id = $1
        ORDER BY t.start_date DESC
      `;
      queryParams = [teamId];
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const result = await query(queryString, queryParams);
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// === POST, PUT, PATCH, DELETE stay here ===
// (your existing code for task creation, update, delete)


export async function POST(request: Request) {
  try {
    console.log("=== TASK CREATION API CALLED ===");
    
    const formData = await request.formData();
    
    // Log all form data keys
    console.log("FormData keys:", Array.from(formData.keys()));
    
    const task_id = formData.get('task_id') as string;
    const task_title = formData.get('task_title') as string;
    const task_description = formData.get('task_description') as string;
    const assigned_to = formData.get('assigned_to') as string;
    const priority = formData.get('priority') as string;
    const start_date = formData.get('start_date') as string;
    const complete_date = formData.get('complete_date') as string;
    const comment = formData.get('comment') as string;
    const team_id = formData.get('team_id') as string;
    const assigned_by = formData.get('assigned_by') as string;
    const task_document = formData.get('task_document') as File;
    const created_date = formData.get('created_date') as string;
    const status = "In Progress";

    console.log("Received form data values:");
    console.log("- task_id:", task_id);
    console.log("- task_title:", task_title);
    console.log("- task_description length:", task_description?.length);
    console.log("- assigned_to:", assigned_to);
    console.log("- priority:", priority);
    console.log("- start_date:", start_date);
    console.log("- complete_date:", complete_date);
    console.log("- comment length:", comment?.length);
    console.log("- team_id:", team_id);
    console.log("- assigned_by:", assigned_by);
    console.log("- task_document:", task_document ? `File: ${task_document.name} (${task_document.size} bytes)` : "No file");

    // Basic validation
    if (!task_id) {
      console.error("Validation failed: task_id is required");
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    if (!task_title) {
      console.error("Validation failed: task_title is required");
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (!task_description) {
      console.error("Validation failed: task_description is required");
      return NextResponse.json({ error: "Task description is required" }, { status: 400 });
    }
    if (!priority) {
      console.error("Validation failed: priority is required");
      return NextResponse.json({ error: "Priority is required" }, { status: 400 });
    }
    if (!assigned_by) {
      console.error("Validation failed: assigned_by is required");
      return NextResponse.json({ error: "Assigned by is required" }, { status: 400 });
    }
    if (!team_id) {
      console.error("Validation failed: team_id is required");
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    console.log("All validations passed");

    // Handle multiple assigned users (comma-separated)
    const assignedToUsers = assigned_to ? assigned_to.split(',').filter(id => id.trim() !== '') : [];
    console.log("Assigned users:", assignedToUsers);

    if (assignedToUsers.length === 0) {
      console.error("Validation failed: No assigned users");
      return NextResponse.json({ error: "At least one team member must be assigned" }, { status: 400 });
    }

    // Handle document upload
    let document_path = null;
    if (task_document && task_document.size > 0) {
      document_path = `/documents/${task_id}_${task_document.name}`;
      console.log("Document path set to:", document_path);
    }

    console.log("Attempting database insert...");
    
    // Test database connection first
    try {
      const testResult = await query('SELECT NOW() as current_time', []);
      console.log("Database connection test successful:", testResult.rows[0]);
    } catch (dbError) {
      console.error("Database connection test failed:", dbError);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Insert into Tasks table
    const insertQuery = `
      INSERT INTO public."Tasks" (
        task_id, task_title, task_description, task_document, assigned_to, 
        priority, start_date, complete_date, comment, team_id, assigned_by, created_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING task_id
    `;
    
    const insertParams = [
      task_id,
      task_title,
      task_description,
      document_path,
      assigned_to,
      priority,
      start_date,
      complete_date || null,
      comment,
      team_id,
      assigned_by,
      created_date,
      status
    ];

    console.log("Insert query:", insertQuery);
    console.log("Insert parameters:", insertParams);

    const result = await query(insertQuery, insertParams);
    console.log("Database insert successful, result:", result);

    return NextResponse.json({ 
      message: "Task created successfully",
      task_id: task_id 
    });

  } catch (error: any) {
    console.error("=== ERROR IN TASK CREATION ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);
    
    if (error.code === '23505') { // Unique violation
      console.error("Duplicate task ID error");
      return NextResponse.json({ error: "Task ID already exists" }, { status: 400 });
    }
    
    if (error.code === '42P01') { // Table doesn't exist
      console.error("Table doesn't exist error");
      return NextResponse.json({ error: "Tasks table not found" }, { status: 500 });
    }
    
    console.error("Unknown database error");
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}

// Add this to your existing app/api/Task/route.ts
export async function DELETE(request: Request) {
  try {
    const { task_id } = await request.json()

    if (!task_id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log("Deleting task:", task_id)

    // Delete the task from the database
    const result = await query(
      'DELETE FROM public."Tasks" WHERE task_id = $1',
      [task_id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Task deleted successfully",
      task_id: task_id 
    })

  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


// Add to your existing app/api/Task/route.ts
// Update your PUT endpoint in app/api/Task/route.ts
export async function PUT(request: Request) {
  try {
    console.log("=== TASK UPDATE API CALLED ===")
    
    const updateData = await request.json()
    console.log("Received update data:", updateData)

    const { 
      task_id, 
      task_title, 
      task_description, 
      priority, 
      assigned_to, 
      comment, 
      complete_date,
      update_date,
      requirement
    } = updateData

    if (!task_id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    // Validate required fields
    if (!task_title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 })
    }
    if (!task_description) {
      return NextResponse.json({ error: "Task description is required" }, { status: 400 })
    }
    if (!priority) {
      return NextResponse.json({ error: "Priority is required" }, { status: 400 })
    }

    console.log("Validated data:", {
      task_title,
      task_description: task_description?.length,
      priority,
      assigned_to,
      comment: comment?.length
    })

    // Update query - handle null values properly
    const result = await query(
      `UPDATE public."Tasks" 
       SET task_title = $1, 
           task_description = $2, 
           priority = $3, 
           assigned_to = COALESCE($4, assigned_to), 
           comment = COALESCE($5, comment), 
           complete_date = $6, 
           updated_date = $7,
           requirement = $9
       WHERE task_id = $8`,
      [
        task_title, 
        task_description, 
        priority, 
        assigned_to || null, 
        comment || null, 
        complete_date || null, 
        update_date || new Date().toISOString().split('T')[0], 
        task_id,
        requirement
      ]
    )

    console.log("Update result rowCount:", result.rowCount)

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Task updated successfully",
      task_id: task_id 
    })

  } catch (error: any) {
    console.error("Error updating task:", error)
    return NextResponse.json({ 
      error: "Database error: " + error.message 
    }, { status: 500 })
  }
}

// Add PATCH endpoint for status updates only
export async function PATCH(request: Request) {
  try {
    console.log("=== TASK STATUS UPDATE API CALLED ===")
    
    const updateData = await request.json()
    console.log("Received status update data:", updateData)

    const { task_id, status, complete_date, updated_by, requirement, task_title } = updateData

    if (!task_id || !status) {
      return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 })
    }
    


    const result = await query(
      `UPDATE public."Tasks" 
       SET status = $1, 
           complete_date = COALESCE($2, complete_date),
           updated_date = $3,
           requirement = $5
       WHERE task_id = $4`,
      [
        status,
        complete_date || null,
        new Date().toISOString().split('T')[0],
        task_id,
        requirement
      ]
    )

    console.log("Status update result rowCount:", result.rowCount)

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

//     // Send notification if task is completed by non-2222 user
//     if (status === 'Completed' && updated_by.user_role !== 2222) {
//   try {
//     // Get team information
//     const teamResult = await query(
//       `SELECT team_id, team_name FROM public."Tasks" WHERE task_id = $1`,
//       [task_id]
//     );

//     if (teamResult.rows.length > 0) {
//       const team = teamResult.rows[0];
//       const notificationData = {
//         type: 'task_completed',
//         task_id: task_id,
//         task_title: task_title || 'Untitled Task',
//         completed_by: updated_by.user_name,
//         completed_by_id: updated_by.user_id,
//         team_id: team.team_id,
//         message: `Task "${task_title || 'Untitled Task'}" has been completed by ${updated_by.user_name}`
//       };

//       // Send real-time notification
//       //sendNotification(notificationData);
      
//       console.log('📢 Notification sent:', notificationData);
//     }
//   } catch (notifyError) {
//     console.error('Failed to send notification:', notifyError);
//     // Don't fail the main request if notification fails
//   }
// }

//     // Create notification if task is completed by user with role 7777
//     if (status === 'Completed' && updated_by && updated_by.user_role === 7777) {
//       try {
//         // Get task details for notification
//         const taskResult = await query(
//           `SELECT task_title FROM public."Tasks" WHERE task_id = $1`,
//           [task_id]
//         );

//         if (taskResult.rows.length > 0) {
//           const task_title = taskResult.rows[0].task_title;
          
//           // Create notification for role 2222
//           await fetch(`${process.env.NEXTAUTH_URL}/Api/notifications`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               task_id: task_id,
//               task_title: task_title,
//               description: `Task "${task_title}" has been completed by ${updated_by.user_name}`,
//               assigned_to_role: 2222, // Notify users with role 2222
//               created_by: updated_by.user_id
//             }),
//           });
//         }
//       } catch (notificationError) {
//         console.error("Error creating notification:", notificationError);
//         // Don't fail the task completion if notification fails
//       }
//     }


    return NextResponse.json({ 
      message: "Task status updated successfully",
      task_id: task_id 
    })

  } catch (error: any) {
    console.error("Error updating task status:", error)
    return NextResponse.json({ 
      error: "Database error: " + error.message 
    }, { status: 500 })
  }
}