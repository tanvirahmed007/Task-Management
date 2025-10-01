// components/Navbar/Navbar.tsx
import React from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Input } from "@/components/ui/input";
import { getTeamMembers } from "@/lib/teams";
import AddMemberDialog from "@/components/addMember/AddMemberDialog";
import CreateTaskDialog from "@/components/CreateTaskDialog/CreateTaskDialog";

interface User {
  user_id: string;
  user_name: string;
  user_img?: string;
  user_role: any;
  user_team?: string;
}

interface NavbarProps {
  user: User | null;
}

export default async function Navbar({ user }: NavbarProps) {
  // Only show navbar for users with role 2222
  if (user?.user_role !== 2222) {
    return null; // Return null to hide the navbar completely
  }

  const canCreateTask = user?.user_role === 2222;
  const teamMembers = user?.user_team ? await getTeamMembers(user.user_team) : [];

  const handleMemberAdded = async () => {
    'use server';
  };

  return (
    <div className="flex items-center justify-between">
      {/* Left side - Menubar */}
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>
            Members {user?.user_team ? `(${teamMembers.length})` : ""}
          </MenubarTrigger>
          <MenubarContent className="max-h-96 overflow-y-auto">
            {!user?.user_team ? (
              <MenubarItem disabled>Not assigned to a team</MenubarItem>
            ) : teamMembers.length === 0 ? (
              <MenubarItem disabled>No team members found</MenubarItem>
            ) : (
              teamMembers.map((member, index) => (
                <React.Fragment key={member.user_id}>
                  <MenubarSub>
                    <MenubarSubTrigger>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.user_name}</span>
                        {member.user_role === 2222 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Admin</span>
                        )}
                        {member.user_id === user.user_id && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">You</span>
                        )}
                      </div>
                    </MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View Profile</MenubarItem>
                      <MenubarItem>Send Message</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Completed Tasks</MenubarItem>
                      <MenubarItem>In-Progress Tasks</MenubarItem>
                      <MenubarItem>Pending Tasks</MenubarItem>
                      {canCreateTask && member.user_id !== user.user_id && (
                        <>
                          <MenubarSeparator />
                          <MenubarItem className="text-red-600">Remove from Team</MenubarItem>
                        </>
                      )}
                    </MenubarSubContent>
                  </MenubarSub>
                  {index < teamMembers.length - 1 && <MenubarSeparator />}
                </React.Fragment>
              ))
            )}
            
            {canCreateTask && user.user_team && (
              <>
                <MenubarSeparator />
                <MenubarItem className="text-green-600 font-medium">
                  <AddMemberDialog user={user} onMemberAdded={handleMemberAdded} />
                </MenubarItem>
              </>
            )}
          </MenubarContent>
        </MenubarMenu>

      </Menubar>

      {/* Right side - Create Task Button */}
      {canCreateTask && (
        <div className="ml-4">
          <CreateTaskDialog user={user} />
        </div>
      )}
    </div>
  );
}