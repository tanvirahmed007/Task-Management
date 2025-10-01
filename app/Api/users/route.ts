// app/api/users/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// app/api/users/route.ts
export async function POST(request: Request) {
  try {
    console.log("=== USER CREATION API CALLED ===");
    
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log("Content-Type:", contentType);
    
    let userData;
    
    if (contentType?.includes('application/json')) {
      // Handle JSON data
      try {
        const bodyText = await request.text();
        console.log("Raw request body:", bodyText);
        
        userData = JSON.parse(bodyText);
        console.log(userData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return NextResponse.json({ 
          error: "Invalid JSON format in request body" 
        }, { status: 400 });
      }
    } else if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      const formData = await request.formData();
      userData = {
        user_name: formData.get('user_name'),
        user_role: formData.get('user_role'),
        user_team: formData.get('user_team'),
        user_email: formData.get('user_mail'),
        user_password: formData.get('user_password')
      };
    } else {
      return NextResponse.json({ 
        error: "Unsupported content type. Use application/json or form-data" 
      }, { status: 400 });
    }
    
    console.log("Parsed user data:", userData);

    const { user_name, user_role, user_team, user_email, user_password, user_img } = userData;
     
    // Validate required fields
    if (!user_name || !user_role || !user_password) {
      return NextResponse.json({ 
        error: "Name, role, email, and password are required" 
      }, { status: 400 });
    }

    // Validate user_role is a number
    const roleInt = parseInt(user_role.toString());
    if (isNaN(roleInt)) {
      return NextResponse.json({ 
        error: "Valid user role is required" 
      }, { status: 400 });
    }

    // Generate a unique user_id
    const user_id = Math.floor(100000 + Math.random() * 900000); // 6-digit number

    // Insert into Users table
    const result = await query(
      `INSERT INTO public."Users" (
        user_id, user_name, user_role, user_team, user_mail, user_password,user_img
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id`,
      [
        user_id,
        user_name.toString(),
        roleInt,
        user_team ? user_team.toString() : null,
        user_email ? user_email.toString() :null,
        user_password.toString(), // In production, hash this password!
        user_img
      ]
    );

    console.log("User created successfully with ID:", result.rows[0].user_id);
    
    return NextResponse.json({ 
      message: "User created successfully",
      user: {
        user_id: result.rows[0].user_id,
        user_name,
        user_role: roleInt,
        user_team,
        user_email
      }
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({ 
        error: "User with this email or ID already exists" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error: " + error.message 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    
    console.log("Fetching users with role:", role);

    let queryString = `SELECT user_id, user_name, user_img FROM public."Users" where user_role=3333`;
    let params: any[] = [];

    // FIXED: Use proper integer comparison for user_role
    if (role) {
      const roleInt = parseInt(role);
      if (!isNaN(roleInt)) {
        queryString += ` WHERE user_role = $1`;
        params.push(roleInt);
      } else {
        console.error("Invalid role parameter:", role);
        return NextResponse.json({ error: "Invalid role parameter" }, { status: 400 });
      }
    }

    queryString += ` ORDER BY user_name`;

    console.log("Executing query:", queryString);
    console.log("With parameters:", params);

    const result = await query(queryString, params);

    console.log("Fetched users:", result.rows.length);
    return NextResponse.json({ users: result.rows });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Add PUT method for updating users if needed
export async function PUT(request: Request) {
  try {
    const { user_id, user_name, user_role, user_img } = await request.json();

    // Validate integer fields
    const userIdInt = parseInt(user_id);
    const userRoleInt = user_role ? parseInt(user_role) : null;

    if (isNaN(userIdInt)) {
      return NextResponse.json({ error: "Valid User ID is required" }, { status: 400 });
    }

    let queryString = `UPDATE public."Users" SET user_name = $1`;
    let params: any[] = [user_name];

    if (userRoleInt !== null && !isNaN(userRoleInt)) {
      queryString += `, user_role = $2`;
      params.push(userRoleInt);
    }

    if (user_img) {
      queryString += `, user_img = $${params.length + 1}`;
      params.push(user_img);
    }

    queryString += ` WHERE user_id = $${params.length + 1}`;
    params.push(userIdInt);

    const result = await query(queryString, params);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User updated successfully",
      user_id: userIdInt 
    });

  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add DELETE method if needed
export async function DELETE(request: Request) {
  try {
    const { user_id } = await request.json();
    const userIdInt = parseInt(user_id);

    if (isNaN(userIdInt)) {
      return NextResponse.json({ error: "Valid User ID is required" }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM public."Users" WHERE user_id = $1',
      [userIdInt]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User deleted successfully",
      user_id: userIdInt 
    });

  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}