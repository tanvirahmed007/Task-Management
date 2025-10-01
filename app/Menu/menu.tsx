// components/Menu/menu.tsx
"use client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface User {
  user_id: string;
  user_name: string;
  user_img: string | null;
}

interface MenuProps {
  user: User | null;
}

export default function Menu({ user }: MenuProps) {
  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await fetch("/Api/auth/logout", { method: "POST" });
      
      // Clear user data from storage
      localStorage.removeItem("currentUser");
      
      window.location.href = "/Login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="left flex items-center gap-2">
      {/* User name displayed beside avatar */}
      {user && (
        <span className="text-sm font-bold text-gray-800 hidden md:block">
          {user.user_name}
        </span>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger className="px-2 py-2 text-white rounded-md focus:outline-none cursor-pointer">
          <Avatar>
            <AvatarImage 
              src={user?.user_img || "https://github.com/shadcn.png"} 
              alt={user?.user_name || "User"}
            />
            <AvatarFallback className="font-extrabold">
              {user ? getInitials(user.user_name) : "CN"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border border-gray-200 rounded-md shadow-lg" sideOffset={5}>
          <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            
            <button onClick={handleLogout} type="submit">Logout</button>
            
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}