// app/Home/page.tsx
import Heading from "../Heading/Heading";
import Menu from "../Menu/menu";
// import Notification from "../Notification/Notification";
import { getCurrentUser } from "@/lib/auth";
import Tasks from "../Tasks/Tasks";

async function getTeamName(teamId: string) {
  if (!teamId) return null;
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/Api/team?team_id=${teamId}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.team_name;
    }
    return null;
  } catch (error) {
    console.error("Error fetching team name:", error);
    return null;
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  console.log("user details",user);
  const teamName = user?.user_team ? await getTeamName(user.user_team) : null;
  return (
    <div className="p-5">
      <div className="flex ...">
        <div className="size-14 flex-none ...">
          <Menu user={user} /> {/* Pass user data to Menu */}
        </div>
        <div className="size-14 grow ...">
          <Heading teamName={teamName} 
            userName={user?.user_name}
            />
        </div>
        <div className="size-14 flex-none ...">
          {/* <Notification userRole={user.user_role} userId={user.user_id} /> */}
        </div>
      </div>   

      <div className="lg:p-10 container">
        <Tasks />
      </div>
    </div>
  );
}