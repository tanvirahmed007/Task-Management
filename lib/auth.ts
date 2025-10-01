import { cookies } from "next/headers";
import { query } from "./db";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("auth-token");
  console.log(token)
  if (!token) return null;

  // Query all necessary user information
  const result = await query(
    'SELECT user_id, user_name, user_img, user_role, user_team FROM public."Users" WHERE user_id=$1',
    [token.value]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}