"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Eye, Edit, Trash2, Loader2, Download, Calendar as CalendarIcon, User, FileText, AlertCircle, CheckCircle2, Save } from "lucide-react"
import { format } from "date-fns"
import { Search, Filter } from "lucide-react"

interface Task {
  task_id: string
  task_title: string
  task_description: string
  priority: string
  status: string
  assigned_to: string
  assigned_to_name: string
  assigned_by_name: string
  team_name: string
  start_date: string
  complete_date: string
  comment: string
  task_document: string
  assigned_uat?: string
  assigned_uat_name?: string
  assigned_uat_img?: string
  requirement?: number 
  uat_status?: string // Add this field
}

interface User {
  user_id: string
  user_name: string
  user_role: number
  user_team?: string
}

interface TaskListProps {
  user: User
}

interface Requirement {
  text: string
  checked: boolean
}

interface Member {
  user_id: string
  user_name: string
  user_img?: string
}

export default function TaskList({ user }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [allRequirementsChecked, setAllRequirementsChecked] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [completeDate, setCompleteDate] = useState<Date>()

  const [uatDialogOpen, setUatDialogOpen] = useState(false)
  const [uatMembers, setUatMembers] = useState<Member[]>([])
  const [selectedUatMember, setSelectedUatMember] = useState<string>("")
  const [assigningUat, setAssigningUat] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  const [uatApproved, setUatApproved] = useState(false);

  // Reset UAT approval when task changes
useEffect(() => {
  if (selectedTask) {
    setUatApproved(selectedTask.uat_status === 'OK');
  }
}, [selectedTask]);

  // Fetch tasks when component mounts or user changes
  useEffect(() => {
    if (user?.user_team) {
      fetchTasks()
      fetchTeamMembers()
    }
  }, [user?.user_team])

  useEffect(() => {
    if (user?.user_team) {
      fetchUatMembers()
    }
  }, [user?.user_team])

  // Set complete date when editing task
  useEffect(() => {
    if (editingTask?.complete_date) {
      setCompleteDate(new Date(editingTask.complete_date))
    } else {
      setCompleteDate(undefined)
    }
  }, [editingTask])

  // Extract requirements when task is selected for view or edit
  useEffect(() => {
    const task = selectedTask || editingTask
    if (task) {
      const extractedRequirements = extractRequirementsFromDescription(task.task_description)
      const initialCheckedState = task.requirement === 1;
      setRequirements(extractedRequirements.map(req => ({ 
        text: req, 
        checked: initialCheckedState 
      })))
      setAllRequirementsChecked(initialCheckedState && extractedRequirements.length > 0)
    }
  }, [selectedTask, editingTask])

  // Check if all requirements are checked
  useEffect(() => {
    if (requirements.length > 0) {
      const allChecked = requirements.every(req => req.checked)
      setAllRequirementsChecked(allChecked)
    } else {
      setAllRequirementsChecked(true)
    }
  }, [requirements])

  // Security check functions
  const canUserModifyTask = (task: Task) => {
    if (user.user_role == 2222) return true;
    //return task.assigned_to === user.user_id;
  };

const canUserViewTask = (task: Task) => {
  console.log("Security check - User role:", user.user_role);
  
  if (user.user_role === 2222) {
    // Team leaders can see all tasks in their team
    return true;
  }
  
  if (user.user_role === 3333) {
    // UAT members can see tasks where they are assigned as UAT (across all teams)
    const userInt = parseInt(user.user_id, 10);
    const taskUatInt = task.assigned_uat ? parseInt(task.assigned_uat.toString(), 10) : null;
    const canView = userInt === taskUatInt;
    console.log("UAT view check:", { userInt, taskUatInt, canView });
    return canView;
  }
  
  if (user.user_role === 7777) {
    // Developers can see tasks assigned to them in their team
    const userInt = parseInt(user.user_id, 10);
    const taskAssignedInt = task.assigned_to ? parseInt(task.assigned_to.toString(), 10) : null;
    const canView = userInt === taskAssignedInt;
    console.log("Developer view check:", { userInt, taskAssignedInt, canView });
    return canView;
  }
  
  return false;
};

// Update the fetchTasks function

// Update the fetchTasks function
const fetchTasks = async () => {
  setLoading(true);
  try {
    console.log("=== FETCHING TASKS ===");
    console.log("User:", {
      id: user.user_id,
      role: user.user_role,
      team: user.user_team,
      name: user.user_name
    });
    
    // Build URL based on user role
    let url = `/api/Task?user_role=${user.user_role}`;
    
    if (user.user_role === 7777) {
      // Developer: need team_id and user_id
      if (!user.user_team) {
        console.error("Developer must be assigned to a team");
        setTasks([]);
        return;
      }
      url += `&team_id=${user.user_team}&user_id=${user.user_id}`;
      console.log("Developer URL:", url);
      
    } else if (user.user_role === 3333) {
      // UAT: only need assigned_uat (no team_id)
      url += `&assigned_uat=${user.user_id}`;
      console.log("UAT URL:", url);
      
    } else if (user.user_role === 2222) {
      // Team Leader: need team_id
      if (!user.user_team) {
        console.error("Team leader must be assigned to a team");
        setTasks([]);
        return;
      }
      url += `&team_id=${user.user_team}`;
      console.log("Team Leader URL:", url);
    }
    
    const response = await fetch(url);
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Tasks received:", data.tasks?.length || 0);
      setTasks(data.tasks || []);
    } else {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      setTasks([]);
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    setTasks([]);
  } finally {
    setLoading(false);
  }
};

  const fetchUatMembers = async () => {
    try {
      const response = await fetch('/api/users?user_role=3333')
      console.log(response)
      if (response.ok) {
        const data = await response.json()
        setUatMembers(data.users || [])
      } else {
        console.error("Failed to fetch UAT members")
        setUatMembers([])
      }
    } catch (error) {
      console.error("Error fetching UAT members:", error)
      setUatMembers([])
    }
  }

  // Filter function
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const taskIdStr = String(task.task_id || '').toLowerCase();
    const taskTitleStr = String(task.task_title || '').toLowerCase();
    const taskDescriptionStr = String(task.task_description || '').toLowerCase();
    const assignedToNameStr = String(task.assigned_to_name || '').toLowerCase();
    const statusStr = String(task.status || '').toLowerCase();

    const basicMatch = 
      taskTitleStr.includes(searchLower) ||
      taskIdStr.includes(searchLower) ||
      taskDescriptionStr.includes(searchLower) ||
      assignedToNameStr.includes(searchLower) ||
      statusStr.includes(searchLower);
    
    const filters = searchLower.split(' ').filter(term => term.includes(':'));
    let advancedMatch = true;
    
    if (filters.length > 0) {
      filters.forEach(filter => {
        const [key, value] = filter.split(':');
        
        switch (key) {
          case 'status':
            advancedMatch = advancedMatch && statusStr.includes(value);
            break;
          case 'priority':
            const priorityMap: { [key: string]: string } = {
              'high': '3',
              'medium': '2',
              'low': '1'
            };
            const taskPriorityStr = String(task.priority || '');
            advancedMatch = advancedMatch && taskPriorityStr === priorityMap[value];
            break;
          case 'assignee':
            advancedMatch = advancedMatch && assignedToNameStr.includes(value);
            break;
          case 'id':
            advancedMatch = advancedMatch && taskIdStr.includes(value);
            break;
          default:
            break;
        }
      });
    }
    
    if (filters.length > 0) {
      const nonFilterTerms = searchLower.split(' ').filter(term => !term.includes(':'));
      if (nonFilterTerms.length > 0) {
        const nonFilterMatch = nonFilterTerms.some(term =>
          taskTitleStr.includes(term) ||
          taskIdStr.includes(term) ||
          taskDescriptionStr.includes(term) ||
          assignedToNameStr.includes(term)
        );
        return advancedMatch && nonFilterMatch;
      }
      return advancedMatch;
    }
    
    return basicMatch;
  });

  const handleAssignUat = async () => {
    if (!selectedTask || !selectedUatMember) {
      alert("Please select a UAT member")
      return
    }

    setAssigningUat(true)
    try {
      const response = await fetch('/api/Task/uat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTask.task_id,
          assigned_uat: selectedUatMember
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("UAT assigned successfully:", result)
        alert("UAT member assigned successfully!")
        setUatDialogOpen(false)
        setSelectedUatMember("")
        fetchTasks()
      } else {
        const error = await response.json()
        alert(`Failed to assign UAT member: ${error.error}`)
      }
    } catch (error) {
      console.error("Error assigning UAT member:", error)
      alert("An error occurred while assigning UAT member.")
    } finally {
      setAssigningUat(false)
    }
  }

  const handleOpenUatDialog = (task: Task) => {
    setSelectedTask(task)
    setUatDialogOpen(true)
  }

  const fetchTeamMembers = async () => {
    if (!user?.user_team) return
    
    try {
      const response = await fetch(`/api/team/members?team_id=${user.user_team}`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      } else {
        console.error("Failed to fetch team members")
        setTeamMembers([])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setTeamMembers([])
    }
  }

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;

    if (!canUserModifyTask(task)) {
      alert("You don't have permission to delete this task");
      return;
    }

    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    setDeletingTaskId(taskId)
    try {
      const response = await fetch(`/api/Task`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId }),
      })

      if (response.ok) {
        setTasks(tasks.filter(task => task.task_id !== taskId))
        alert("Task deleted successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to delete task: ${error.error}`)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("An error occurred while deleting the task.")
    } finally {
      setDeletingTaskId(null)
    }
  }

  const handleViewTask = (task: Task) => {
    if (!canUserViewTask(task)) {
      alert("You can only view tasks assigned to you");
      return;
    }
    setSelectedTask(task)
    setViewDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    if (!canUserModifyTask(task)) {
      alert("You don't have permission to edit this task");
      return;
    }

    setEditingTask({
      ...task,
      task_title: task.task_title || '',
      task_description: task.task_description || '',
      priority: task.priority || '2',
      assigned_to: task.assigned_to || '',
      comment: task.comment || ''
    })
    setEditDialogOpen(true)
  }

  const handleSaveTask = async () => {
    if (!editingTask) return

    setSaving(true)
    try {
      const updateData = {
        task_id: editingTask.task_id,
        task_title: editingTask.task_title || '',
        task_description: editingTask.task_description || '',
        priority: editingTask.priority || '2',
        assigned_to: editingTask.assigned_to || null,
        comment: editingTask.comment || null,
        complete_date: completeDate ? format(completeDate, "yyyy-MM-dd") : (editingTask.complete_date || null),
        update_date: new Date().toISOString().split('T')[0]
      }

      console.log("Sending update data:", updateData)

      if (!updateData.task_title.trim()) {
        alert("Please fill in Task Title")
        setSaving(false)
        return
      }
      if (!updateData.task_description.trim()) {
        alert("Please fill in Task Description")
        setSaving(false)
        return
      }
      if (!updateData.priority) {
        alert("Please select Priority")
        setSaving(false)
        return
      }

      const response = await fetch('/api/Task', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Update successful:", result)
        alert("Task updated successfully!")
        setEditDialogOpen(false)
        fetchTasks()
      } else {
        const errorText = await response.text()
        console.error("Update failed:", errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          alert(`Failed to update task: ${errorData.error}`)
        } catch {
          alert(`Failed to update task: ${errorText}`)
        }
      }
    } catch (error) {
      console.error("Error updating task:", error)
      alert("An error occurred while updating the task.")
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteUat = async () => {
  if (!selectedTask) return

  // Check if UAT user is assigned to this task
  const userInt = parseInt(user.user_id, 10);
  const taskUatInt = selectedTask.assigned_uat ? parseInt(selectedTask.assigned_uat.toString(), 10) : null;
  
  if (userInt !== taskUatInt) {
    alert("You are not assigned as UAT for this task");
    return;
  }

  try {
    const response = await fetch('/api/Task/uat-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: selectedTask.task_id,
        uat_status: 'OK',
        updated_by: {
          user_id: user.user_id,
          user_name: user.user_name,
          user_role: user.user_role
        }
      }),
    })

    if (response.ok) {
      alert("UAT completed successfully!")
      setViewDialogOpen(false)
      fetchTasks()
    } else {
      const error = await response.json()
      alert(`Failed to complete UAT: ${error.error}`)
    }
  } catch (error) {
    console.error("Error completing UAT:", error)
    alert("An error occurred while completing UAT.")
  }
}

  const handleCompleteTask = async () => {
  if (!selectedTask) return

  if (selectedTask.assigned_to !== user.user_id) {
    alert("You can only complete tasks assigned to you");
    return;
  }

  // Check if all requirements are completed
  if (!allRequirementsChecked && requirements.length > 0) {
    alert("Please complete all requirements before marking the task as complete.");
    return;
  }

  try {
    const response = await fetch('/api/Task', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: selectedTask.task_id,
        status: 'Completed',
        complete_date: new Date().toISOString().split('T')[0],
        requirement: allRequirementsChecked ? 1 : 0, // Update requirement field
        updated_by: {
          user_id: user.user_id,
          user_name: user.user_name,
          user_role: user.user_role
        }
      }),
    })

    if (response.ok) {
      alert("Task marked as completed!")
      setViewDialogOpen(false)
      fetchTasks()
    } else {
      const error = await response.json()
      alert(`Failed to complete task: ${error.error}`)
    }
  } catch (error) {
    console.error("Error completing task:", error)
    alert("An error occurred while completing the task.")
  }
}

  const handleRequirementToggle = (index: number) => {
    setRequirements(prev => {
      const newRequirements = prev.map((req, i) => 
        i === index ? { ...req, checked: !req.checked } : req
      )
      
      const allChecked = newRequirements.length > 0 ? newRequirements.every(req => req.checked) : false;
      setAllRequirementsChecked(allChecked);
      
      return newRequirements;
    })
  }

  const extractRequirementsFromDescription = (description: string): string[] => {
    if (!description) return []
    
    const regex = /(?:\d+[\.\)]|\-|\*)\s*(.+?)\s*;/g
    const matches = []
    let match
    
    while ((match = regex.exec(description)) !== null) {
      const fullMatch = description.substring(match.index, match.index + match[0].length)
      matches.push(fullMatch)
    }
    
    return matches
  }

  const handleDownloadFile = () => {
    if (selectedTask?.task_document) {
      const link = document.createElement('a')
      link.href = selectedTask.task_document
      link.download = selectedTask.task_document.split('/').pop() || 'document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getPriorityName = (priority: string) => {
    switch (priority) {
      case "3": return "High"
      case "2": return "Medium"
      case "1": return "Low"
      default: return "Unknown"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "3": return "bg-red-500"
      case "2": return "bg-orange-500"
      case "1": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "3": return "bg-red-600 text-white border-red-700"
      case "2": return "bg-orange-500 text-white border-orange-600"
      case "1": return "bg-black text-white border-gray-800"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "success"
      case "in progress": return "info"
      case "pending": return "destructive"
      default: return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set"
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return "Invalid date"
    }
  }

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (!description) return ""
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + "..."
  }

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    )
  }

  if (!user?.user_team) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        You are not assigned to any team.
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {user.user_role === 2222 ? (
          "No tasks found for your team."
        ) : (
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No tasks assigned to you</h3>
            <p className="text-sm">You don't have any tasks assigned at the moment.</p>
            <p className="text-xs">Your team leader will assign tasks to you when needed.</p>
          </div>
        )}
      </div>
    )
  }

  if (tasks.length === 0) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {user.user_role === 2222 ? (
        "No tasks found for your team."
      ) : user.user_role === 3333 ? (
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No UAT tasks assigned to you</h3>
          <p className="text-sm">You don't have any UAT tasks assigned at the moment.</p>
          <p className="text-xs">Team leaders will assign UAT tasks to you when needed.</p>
        </div>
      ) : user.user_role === 7777 ? (
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No tasks assigned to you</h3>
          <p className="text-sm">You don't have any tasks assigned at the moment.</p>
          <p className="text-xs">Your team leader will assign tasks to you when needed.</p>
        </div>
      ): (
        "No tasks found."
      )}
    </div>
  );
}

  if (filteredTasks.length === 0 && searchTerm) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {user.user_role === 2222 ? (
          <>
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found matching your search criteria.</p>
            <p className="text-sm">Try adjusting your search terms or filters.</p>
            {/* <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
              className="mt-4"
            >
              Clear Search
            </Button> */}
          </>
        ) : user.user_role === 3333 ? (
        <>
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No UAT tasks match your search.</p>
          <p className="text-sm">You can only search through UAT tasks assigned to you.</p>
          {/* <Button 
            variant="outline" 
            onClick={() => setSearchTerm("")}
            className="mt-4"
          >
            Clear Search
          </Button> */}
        </>
      ) : user.user_role === 7777 ? (
        <>
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assigned tasks match your search.</p>
          <p className="text-sm">You can only search through tasks assigned to you.</p>
        </>
      ) : (
        "No tasks found."
      )}
      <Button 
        variant="outline" 
        onClick={() => setSearchTerm("")}
        className="mt-4"
      >
        Clear Search
      </Button>
      </div>
    )
  }

  return (
    <>
      {/* Filter and Search Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by task title, ID, description, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredTasks.length} of {tasks.length} tasks
          </Badge>
          
          {/* Only show filter button for team leaders */}
          {user.user_role === 2222 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Options - Only for team leaders */}
      {filterOpen && user.user_role === 2222 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                  Status
                </Label>
                <Select onValueChange={(value) => {
                  if (value === "all") {
                    setSearchTerm(prev => prev.replace(/status:\w+/g, '').trim());
                  } else {
                    setSearchTerm(prev => {
                      const withoutStatus = prev.replace(/status:\w+/g, '').trim();
                      return withoutStatus ? `${withoutStatus} status:${value}` : `status:${value}`;
                    });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <Label htmlFor="priority-filter" className="text-sm font-medium mb-2 block">
                  Priority
                </Label>
                <Select onValueChange={(value) => {
                  if (value === "all") {
                    setSearchTerm(prev => prev.replace(/priority:\w+/g, '').trim());
                  } else {
                    setSearchTerm(prev => {
                      const withoutPriority = prev.replace(/priority:\w+/g, '').trim();
                      return withoutPriority ? `${withoutPriority} priority:${value}` : `priority:${value}`;
                    });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To Filter */}
              <div>
                <Label htmlFor="assignee-filter" className="text-sm font-medium mb-2 block">
                  Assigned To
                </Label>
                <Select onValueChange={(value) => {
                  if (value === "all") {
                    setSearchTerm(prev => prev.replace(/assignee:\w+/g, '').trim());
                  } else {
                    const member = teamMembers.find(m => m.user_id === value);
                    if (member) {
                      setSearchTerm(prev => {
                        const withoutAssignee = prev.replace(/assignee:\w+/g, '').trim();
                        return withoutAssignee ? `${withoutAssignee} assignee:${member.user_name}` : `assignee:${member.user_name}`;
                      });
                    }
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterOpen(false);
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTasks.map((task) => (
          <Card key={task.task_id} className="min-w-[280px] hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-semibold leading-tight flex-1">
                  {task.task_title}
                </CardTitle>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  ID: {task.task_id}
                </Badge>
              </div>
              
              {task.task_description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {truncateDescription(task.task_description, 80)}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`capitalize text-xs border ${getPriorityStyle(task.priority)}`}>
                  Priority: {getPriorityName(task.priority)}
                </Badge>
                
                <Badge variant={getStatusVariant(task.status)} className="capitalize text-xs">
                  Status: {task.status || "Unknown"}
                </Badge>
                {/* ADD THE UAT STATUS BADGES RIGHT HERE */}

                
                {task.uat_status === 'OK' && (
                  <Badge variant="success" className="text-xs">
                    UAT Approved
                  </Badge>
                )}
                
                {user.user_role === 3333 && task.assigned_uat === user.user_id && task.requirement === 1 && task.uat_status !== 'OK' && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                    Ready for UAT
                  </Badge>
                )}
                
              </div>

              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <div className="truncate">
                  <span className="font-medium">To:</span> {task.assigned_to_name || "Unassigned"}
                </div>
                <div className="truncate">
                  <span className="font-medium">Start:</span> {formatDate(task.start_date)}
                </div>
                {/* Show assigned by for non-2222 users */}
                {user.user_role !== 2222 && user.user_role !== 3333 && (
                  <div className="truncate">
                    <span className="font-medium">Assigned by:</span> {task.assigned_by_name || "Unknown"}
                  </div>
                )}
                {user.user_role === 3333 && (
                  <div className="truncate">
                    <span className="font-medium">UAT Assignment:</span> {task.assigned_uat_name === user.user_name ? "You" : task.assigned_uat_name || "Not assigned"}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end border-t pt-3">
                {/* UAT Button - Only for team leaders and completed tasks */}
                {user.user_role === 2222 && task.status === 'Completed' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
                    onClick={() => handleOpenUatDialog(task)}
                    title="Assign UAT Member"
                  >
                    <User className="h-3 w-3 mr-1" />
                    UAT
                  </Button>
                )}

                {/* View Button - Available for all users who can view the task */}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => handleViewTask(task)}
                  title={canUserViewTask(task) ? "View task details" : "You can only view tasks assigned to you"}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                {/* Edit and Delete Buttons - Only for team leaders or task assignees */}
                {canUserModifyTask(task) && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => handleEditTask(task)}
                      title="Edit task"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-7 text-xs"
                      onClick={() => deleteTask(task.task_id)}
                      disabled={deletingTaskId === task.task_id}
                      title="Delete task"
                    >
                      {deletingTaskId === task.task_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* UAT Assignment Dialog */}
      <Dialog open={uatDialogOpen} onOpenChange={setUatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assign UAT Member - {selectedTask?.task_title}
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              {/* Task Details (Readonly) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Task ID</Label>
                  <Input value={selectedTask.task_id} disabled className="bg-gray-100" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <Input value={selectedTask.task_title} disabled className="bg-gray-100" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea 
                  value={selectedTask.task_description} 
                  disabled 
                  rows={4}
                  className="bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(selectedTask.status)} className="capitalize">
                      {selectedTask.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={`capitalize mt-1 ${getPriorityStyle(selectedTask.priority)}`}>
                    {getPriorityName(selectedTask.priority)}
                  </Badge>
                </div>
              </div>

              {/* Document Download */}
              {selectedTask.task_document && (
                <div>
                  <Label className="text-sm font-medium">Document</Label>
                  <div className="mt-1 p-3 bg-green-50 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div>
                        <FileText className="h-4 w-4 inline mr-2" />
                        <span className="text-sm">
                          {selectedTask.task_document.split('/').pop()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadFile}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Input value={formatDate(selectedTask.start_date)} disabled className="bg-gray-100" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Completion Date</Label>
                  <Input value={formatDate(selectedTask.complete_date)} disabled className="bg-gray-100" />
                </div>
              </div>

              {/* Assignment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Assigned By</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded-md">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedTask.assigned_by_name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedTask.assigned_by_name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded-md">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedTask.assigned_to_name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedTask.assigned_to_name}</span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {selectedTask.comment && (
                <div>
                  <Label className="text-sm font-medium">Important Comment</Label>
                  <Textarea 
                    value={selectedTask.comment} 
                    disabled 
                    rows={3}
                    className="bg-amber-50 border-amber-200"
                  />
                </div>
              )}

              {/* UAT Member Selection */}
              <div>
                <Label className="text-sm font-medium">Select UAT Member *</Label>
                <Select 
                  value={selectedUatMember} 
                  onValueChange={setSelectedUatMember}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select UAT member" />
                  </SelectTrigger>
                  <SelectContent>
                    {uatMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user_img} alt={member.user_name} />
                            <AvatarFallback className="text-xs">
                              {member.user_name ? member.user_name.split(' ').map(n => n[0]).join('') : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUatDialogOpen(false)
                    setSelectedUatMember("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignUat}
                  disabled={assigningUat || !selectedUatMember}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {assigningUat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  Assign UAT
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Details - {selectedTask?.task_title}
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Task ID</Label>
                  <p className="text-sm font-mono">{selectedTask.task_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm font-semibold">{selectedTask.task_title}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm whitespace-pre-wrap mt-1 p-3 bg-gray-50 rounded-md">
                  {selectedTask.task_description}
                </p>
              </div>

              {/* Requirements Section */}
              {requirements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Requirements</Label>
                  <div className="space-y-2 mt-2 p-3 bg-blue-50 rounded-md">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Checkbox
                          id={`view-req-${index}`}
                          checked={req.checked}
                          onCheckedChange={() => handleRequirementToggle(index)}
                        />
                        <label
                          htmlFor={`view-req-${index}`}
                          className={`text-sm leading-none cursor-pointer flex-1 ${
                            req.checked ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {req.text}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Requirements Status Message */}
                  {user.user_role === 7777 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {allRequirementsChecked ? 
                        "All requirements completed - Ready to mark task as complete" :
                        `Complete all requirements (${requirements.filter(req => req.checked).length}/${requirements.length})`
                      }
                    </div>
                  )}
                </div>
              )}

              {/* File Download */}
              {selectedTask.task_document && (
                <div>
                  <Label className="text-sm font-medium">Document</Label>
                  <div className="mt-1 p-3 bg-green-50 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div>
                        <FileText className="h-4 w-4 inline mr-2" />
                        <span className="text-sm">
                          {selectedTask.task_document.split('/').pop()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadFile}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={`capitalize mt-1 ${getPriorityStyle(selectedTask.priority)}`}>
                    <span className={`w-2 h-2 rounded-full ${getPriorityColor(selectedTask.priority)} mr-1`}></span>
                    {getPriorityName(selectedTask.priority)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusVariant(selectedTask.status)} className="capitalize mt-1">
                    {selectedTask.status}
                  </Badge>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Start Date
                  </Label>
                  <p className="text-sm mt-1 font-medium">{formatDate(selectedTask.start_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Completion Date
                  </Label>
                  <p className="text-sm mt-1 font-medium">{formatDate(selectedTask.complete_date)}</p>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned To
                  </Label>
                  <p className="text-sm mt-1">{selectedTask.assigned_to_name || "Unassigned"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned By
                  </Label>
                  <p className="text-sm mt-1">{selectedTask.assigned_by_name || "Unknown"}</p>
                </div>
              </div>

              {selectedTask.assigned_uat_name && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned UAT Member
                  </Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded-md">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTask.assigned_uat_img} alt={selectedTask.assigned_uat_name} />
                      <AvatarFallback className="text-sm">
                        {selectedTask.assigned_uat_name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedTask.assigned_uat_name}</span>
                  </div>
                </div>
              )}

              {/* Important Comment */}
              {selectedTask.comment && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <Label className="text-sm font-medium flex items-center gap-1 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Important Comment
                  </Label>
                  <p className="text-sm mt-1 text-amber-700 whitespace-pre-wrap">
                    {selectedTask.comment}
                  </p>
                </div>
              )}

              {/* UAT Completion Section - Only for UAT users assigned to this task */}
              {user.user_role === 3333 && selectedTask.assigned_uat === user.user_id && (
                <div className="p-4 border-t">
                  <Label className="text-sm font-medium flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    UAT Approval
                  </Label>
                  
                  <div className="mt-3 space-y-3">
                    {/* UAT Requirements Check */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="uat-requirements"
                        // UAT can only complete if developer has completed requirements
                        checked={selectedTask.requirement === 1}
                        disabled={selectedTask.requirement !== 1}
                      />
                      <label
                        htmlFor="uat-requirements"
                        className={`text-sm leading-none cursor-pointer flex-1 ${
                          selectedTask.requirement === 1 ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        Developer has completed all requirements
                        {selectedTask.requirement !== 1 && (
                          <span className="text-xs text-amber-600 block">
                            Waiting for developer to complete requirements
                          </span>
                        )}
                      </label>
                    </div>

                    {/* UAT Approval Checkbox */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="uat-approval"
                        checked={selectedTask.uat_status === 'OK'}
                        onCheckedChange={(checked) => {
                          // This will enable/disable the Complete UAT button
                          setUatApproved(!!checked);
                        }}
                        disabled={selectedTask.requirement !== 1 || selectedTask.uat_status === 'OK'}
                      />
                      <label
                        htmlFor="uat-approval"
                        className="text-sm leading-none cursor-pointer flex-1"
                      >
                        I approve this task for UAT completion
                        {selectedTask.uat_status === 'OK' && (
                          <span className="text-xs text-green-600 block">
                            UAT already completed
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Complete UAT Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleCompleteUat}
                        disabled={
                          selectedTask.requirement !== 1 || 
                          selectedTask.uat_status === 'OK' ||
                          !uatApproved
                        }
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {selectedTask.uat_status === 'OK' ? 'UAT Completed' : 'Complete UAT'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Button - Only show for task assignees */}
              {selectedTask.assigned_to === user.user_id && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleCompleteTask}
                    disabled={!allRequirementsChecked || selectedTask.status === 'Completed'}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedTask.status === 'Completed' ? 'Task Completed' : 'Mark as Complete'}
                  </Button>
                  
                  {/* Show requirement status */}
                  {requirements.length > 0 && (
                    <div className="flex items-center gap-2 ml-4 text-sm text-muted-foreground">
                      <span>Requirements: {allRequirementsChecked ? 'Completed' : 'Incomplete'}</span>
                      <Badge variant={allRequirementsChecked ? "success" : "secondary"}>
                        {requirements.filter(req => req.checked).length}/{requirements.length}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Requirements Check Message */}
              {!allRequirementsChecked && requirements.length > 0 && selectedTask.assigned_to === user.user_id && (
                <div className="text-sm text-amber-600 text-center">
                  Complete all requirements to mark this task as completed.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Task - {editingTask?.task_id}
            </DialogTitle>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-6">
              {/* Task ID (readonly) */}
              <div>
                <Label className="text-sm font-medium">Task ID</Label>
                <Input 
                  value={editingTask.task_id} 
                  disabled 
                  className="bg-gray-100"
                />
              </div>

              {/* Task Title */}
              <div>
                <Label className="text-sm font-medium">Task Title *</Label>
                <Input 
                  value={editingTask.task_title}
                  onChange={(e) => setEditingTask({...editingTask, task_title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Task Description */}
              <div>
                <Label className="text-sm font-medium">Task Description *</Label>
                <Textarea 
                  value={editingTask.task_description}
                  onChange={(e) => setEditingTask({...editingTask, task_description: e.target.value})}
                  placeholder="Enter task description. Use numbered lists (1., 2., etc.) or bullet points (-, *) followed by a semicolon to create requirements."
                  rows={6}
                  required
                />
              </div>

              {/* Requirements Section */}
              {requirements.length > 0 && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <Label className="text-sm font-medium">Requirements (auto-extracted)</Label>
                  <div className="space-y-2 mt-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Checkbox
                          id={`edit-req-${index}`}
                          checked={req.checked}
                          onCheckedChange={() => handleRequirementToggle(index)}
                        />
                        <label
                          htmlFor={`edit-req-${index}`}
                          className={`text-sm leading-none cursor-pointer flex-1 ${
                            req.checked ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {req.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority with Colors */}
              <div>
                <Label className="text-sm font-medium">Priority *</Label>
                <Select 
                  value={editingTask.priority} 
                  onValueChange={(value) => setEditingTask({...editingTask, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        High Priority
                      </span>
                    </SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        Medium Priority
                      </span>
                    </SelectItem>
                    <SelectItem value="1">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        Low Priority
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status - Disabled as requested */}
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Input 
                  value={editingTask.status} 
                  disabled 
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Status cannot be changed from edit dialog
                </p>
              </div>

              {/* Assigned To with Avatars */}
              <div>
                <Label className="text-sm font-medium">Assigned To</Label>
                <Select 
                  value={editingTask.assigned_to || "unassigned"} 
                  onValueChange={(value) => setEditingTask({...editingTask, assigned_to: value === "unassigned" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user_img} alt={member.user_name} />
                            <AvatarFallback className="text-xs">
                              {member.user_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently assigned to: {editingTask.assigned_to_name || "Unassigned"}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Input 
                    value={formatDate(editingTask.start_date)} 
                    disabled 
                    className="bg-gray-100" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {completeDate ? format(completeDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={completeDate}
                        onSelect={setCompleteDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Task Document Info */}
              {editingTask.task_document && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <Label className="text-sm font-medium">Attached Document</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{editingTask.task_document.split('/').pop()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Document cannot be changed from edit dialog
                  </p>
                </div>
              )}

              {/* Important Comment with word limit */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  Important Comment (Notice) - Max 100 words
                </Label>
                <Textarea 
                  value={editingTask.comment}
                  onChange={(e) => {
                    const text = e.target.value
                    const wordCount = getWordCount(text)
                    if (wordCount <= 100 || text.length < editingTask.comment.length) {
                      setEditingTask({...editingTask, comment: text})
                    }
                  }}
                  placeholder="Add important notice (maximum 100 words)..."
                  rows={3}
                  className="border-amber-200 bg-amber-50"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={getWordCount(editingTask.comment) > 100 ? "text-red-600" : "text-amber-600"}>
                    {getWordCount(editingTask.comment)}/100 words
                  </span>
                  {getWordCount(editingTask.comment) > 100 && (
                    <span className="text-red-600 font-semibold">Word limit exceeded!</span>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTask}
                  disabled={saving || getWordCount(editingTask.comment) > 100}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Update Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}