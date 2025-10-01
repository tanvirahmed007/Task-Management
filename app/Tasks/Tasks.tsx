import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "../Menubar/Menubar";
import { getCurrentUser } from "@/lib/auth";
import TaskList from "../works/page";

export default async function Tasks(){
    const user = await getCurrentUser();
      console.log(user);
    return(
        <div>
            <div className="flex items-center justify-center">
                <Navbar user={user}/>
            </div>
            <div className="mt-10">
                <TaskList user={user}/>
            </div>
        </div>
    );
}
