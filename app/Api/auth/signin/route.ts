// app/api/auth/signin/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// ... existing imports ...

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    console.log("Login attempt for user:", username);

    const result = await query(
      'SELECT user_id, user_password, user_role, user_name, user_img FROM public."Users" WHERE user_id=$1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log("User not found:", username);
      return NextResponse.json({ error: "Invalid user or password" }, { status: 401 });
    }

    const user = result.rows[0];
    
    if (user.user_password !== password) {
      console.log("Invalid password for user:", username);
      return NextResponse.json({ error: "Invalid user or password" }, { status: 401 });
    }

    console.log("Login successful for user:", username);

    const response = NextResponse.json({ 
      message: "Login successful",
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_img: user.user_img,
        user_role: user.user_role
      }
    });

    // Set the auth cookie
    response.cookies.set({
      name: "auth-token",
      value: username,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("Auth cookie set for user:", username);
    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}