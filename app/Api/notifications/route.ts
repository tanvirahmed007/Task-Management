// // app/Api/notifications/route.ts
// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";

// // GET - Fetch notifications for a specific role
// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const assignedToRole = searchParams.get("assigned_to_role");
    
//     if (!assignedToRole) {
//       return NextResponse.json({ error: "Role is required" }, { status: 400 });
//     }

//     const result = await query(
//       `SELECT 
//         id, task_id, task_title, description, assigned_to_role,
//         created_by, created_date, read_status, read_date
//        FROM public."Notifications" 
//        WHERE assigned_to_role = $1 
//        ORDER BY created_date DESC`,
//       [assignedToRole]
//     );

//     return NextResponse.json({ 
//       notifications: result.rows 
//     });

//   } catch (error: any) {
//     console.error("Error fetching notifications:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch notifications" },
//       { status: 500 }
//     );
//   }
// }

// // POST - Create a new notification
// export async function POST(request: Request) {
//   try {
//     const notificationData = await request.json();
    
//     const { task_id, task_title, description, assigned_to_role, created_by } = notificationData;

//     if (!task_id || !task_title || !assigned_to_role || !created_by) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const result = await query(
//       `INSERT INTO public."Notifications" 
//        (task_id, task_title, description, assigned_to_role, created_by) 
//        VALUES ($1, $2, $3, $4, $5) 
//        RETURNING id`,
//       [task_id, task_title, description, assigned_to_role, created_by]
//     );

//     return NextResponse.json({
//       message: "Notification created successfully",
//       notification_id: result.rows[0].id
//     });

//   } catch (error: any) {
//     console.error("Error creating notification:", error);
//     return NextResponse.json(
//       { error: "Failed to create notification" },
//       { status: 500 }
//     );
//   }
// }

// // PATCH - Mark notification as read
// export async function PATCH(request: Request) {
//   try {
//     const { notification_id } = await request.json();

//     if (!notification_id) {
//       return NextResponse.json(
//         { error: "Notification ID is required" },
//         { status: 400 }
//       );
//     }

//     const result = await query(
//       `UPDATE public."Notifications" 
//        SET read_status = TRUE, read_date = CURRENT_TIMESTAMP 
//        WHERE id = $1 
//        RETURNING id`,
//       [notification_id]
//     );

//     if (result.rowCount === 0) {
//       return NextResponse.json(
//         { error: "Notification not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       message: "Notification marked as read"
//     });

//   } catch (error: any) {
//     console.error("Error marking notification as read:", error);
//     return NextResponse.json(
//       { error: "Failed to update notification" },
//       { status: 500 }
//     );
//   }
// }

// // PATCH - Mark all notifications as read for a role
// export async function PUT(request: Request) {
//   try {
//     const { assigned_to_role } = await request.json();

//     if (!assigned_to_role) {
//       return NextResponse.json(
//         { error: "Role is required" },
//         { status: 400 }
//       );
//     }

//     const result = await query(
//       `UPDATE public."Notifications" 
//        SET read_status = TRUE, read_date = CURRENT_TIMESTAMP 
//        WHERE assigned_to_role = $1 AND read_status = FALSE 
//        RETURNING id`,
//       [assigned_to_role]
//     );

//     return NextResponse.json({
//       message: "All notifications marked as read",
//       updated_count: result.rowCount
//     });

//   } catch (error: any) {
//     console.error("Error marking all notifications as read:", error);
//     return NextResponse.json(
//       { error: "Failed to update notifications" },
//       { status: 500 }
//     );
//   }
// }