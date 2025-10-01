// // components/Notification.tsx
// "use client"

// import * as React from "react"
// import { Bell, CheckCircle2, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react"
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// // import { useNotifications } from "@/app/hooks/notifications"

// interface NotificationProps {
//   userRole: number
//   userId: string
// }

// export default function Notification({ userRole, userId }: NotificationProps) {
//   const { notifications, isConnected, error, clearNotifications, clearError } = useNotifications(userId, userRole);

//   if (userRole !== 2222) {
//     return null;
//   }

//   const formatTime = (timestamp: string) => {
//     return new Date(timestamp).toLocaleTimeString();
//   };

//   const handleRetry = () => {
//     clearError();
//     window.location.reload(); // Simple retry by reloading
//   };

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="icon" className="relative rounded-full">
//           <Bell className="h-5 w-5" />
//           {notifications.length > 0 && (
//             <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0 text-xs rounded-full">
//               {notifications.length}
//             </Badge>
//           )}
//           <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
//             isConnected ? 'bg-green-500' : 'bg-red-500'
//           }`} />
//         </Button>
//       </DropdownMenuTrigger>

//       <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
//         <DropdownMenuLabel className="flex justify-between items-center">
//           <span>Notifications</span>
//           <div className="flex items-center gap-2">
//             <div className={`flex items-center gap-1 text-xs ${
//               isConnected ? 'text-green-600' : 'text-red-600'
//             }`}>
//               {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
//               {isConnected ? 'Live' : 'Offline'}
//             </div>
//           </div>
//         </DropdownMenuLabel>
        
//         {error && (
//           <div className="p-3 bg-red-50 border border-red-200 rounded m-2">
//             <div className="flex items-center gap-2 text-red-800">
//               <AlertCircle className="h-4 w-4" />
//               <span className="text-sm">Connection error</span>
//             </div>
//             <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2 w-full">
//               <RefreshCw className="h-3 w-3 mr-1" />
//               Retry Connection
//             </Button>
//           </div>
//         )}

//         <DropdownMenuSeparator />

//         {notifications.length === 0 ? (
//           <div className="px-4 py-8 text-center text-sm text-muted-foreground">
//             <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
//             <p>No notifications yet</p>
//             <p className="text-xs mt-1">You'll see notifications here when team members complete tasks.</p>
//           </div>
//         ) : (
//           <>
//             <div className="p-2 flex justify-between items-center">
//               <span className="text-xs text-muted-foreground">
//                 {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
//               </span>
//               <Button variant="ghost" size="sm" onClick={clearNotifications} className="h-6 text-xs">
//                 <CheckCircle2 className="h-3 w-3 mr-1" />
//                 Clear all
//               </Button>
//             </div>
            
//             {notifications.map((notification, index) => (
//               <DropdownMenuItem key={index} className="flex items-start gap-3 p-3">
//                 <Avatar className="h-8 w-8 bg-blue-100">
//                   <AvatarFallback className="text-blue-600 text-xs">
//                     ✓
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium truncate">{notification.task_title}</p>
//                   <p className="text-xs text-muted-foreground truncate">
//                     Completed by {notification.completed_by}
//                   </p>
//                   <p className="text-[10px] text-muted-foreground">
//                     {formatTime(notification.timestamp)}
//                   </p>
//                 </div>
//               </DropdownMenuItem>
//             ))}
//           </>
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }