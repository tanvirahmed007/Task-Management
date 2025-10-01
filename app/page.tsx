import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  console.log("Root page loading...");
  const user = await getCurrentUser();
  console.log("User from getCurrentUser:", user);
  
  if (!user) {
    console.log("No user found, redirecting to /Login");
    redirect("/Login");
    return null;
  }
  
  console.log("User found, redirecting to /Home");
  redirect("/Home");
  return null;
}