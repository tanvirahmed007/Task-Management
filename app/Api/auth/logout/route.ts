// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
  return response;
}
