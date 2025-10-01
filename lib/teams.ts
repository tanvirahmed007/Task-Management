// lib/teams.ts
import { query } from "./db";

export async function getTeamMembers(teamId: string) {
  if (!teamId) return [];
  
  const result = await query(
    'SELECT user_id, user_name, user_img, user_role FROM public."Users" WHERE user_team=$1 ORDER BY user_name',
    [teamId]
  );
  
  return result.rows;
}