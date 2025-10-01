"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react"

interface Member {
  user_id: string
  user_name: string
  user_img?: string
}

interface Priority {
  priority_id: string
  priority_level: string
}

interface User {
  user_id: string
  user_name: string
  user_team?: string
}

interface CreateTaskDialogProps {
  user: User
}

export default function CreateTaskDialog({ user }: CreateTaskDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [requirements, setRequirements] = React.useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])
  const [dueDate, setDueDate] = React.useState<Date>()
  const [description, setDescription] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [importantComment, setImportantComment] = React.useState("")
  const [teamMembers, setTeamMembers] = React.useState<Member[]>([])
  const [priorities, setPriorities] = React.useState<Priority[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loadingMembers, setLoadingMembers] = React.useState(false)
  const [loadingPriorities, setLoadingPriorities] = React.useState(false)
  const [selectedPriority, setSelectedPriority] = React.useState<string>("")
  const [taskId, setTaskId] = React.useState<string>("")

  // Calculate word count for important comment
  const wordCount = importantComment.trim() ? importantComment.trim().split(/\s+/).length : 0
  const isOverLimit = wordCount > 100
  const wordsRemaining = 100 - wordCount

  // Generate a 6-digit integer task ID
  const generateSixDigitTaskId = (): string => {
    // Generate a random number between 100000 and 999999 (6 digits)
    const min = 100000
    const max = 999999
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min
    return randomId.toString()
  }

  // Generate task ID when dialog opens or when we need a new one
  const generateTaskId = () => {
    const newTaskId = generateSixDigitTaskId()
    setTaskId(newTaskId)
    console.log("Generated new task ID:", newTaskId)
  }

  // Generate task ID when dialog opens
  React.useEffect(() => {
    if (open) {
      generateTaskId()
    }
  }, [open])

  // Fetch team members and priorities when dialog opens
  React.useEffect(() => {
    if (open && user?.user_team) {
      fetchTeamMembers()
      fetchPriorities()
    }
  }, [open, user?.user_team])

  const fetchTeamMembers = async () => {
    if (!user?.user_team) return
    
    setLoadingMembers(true)
    try {
      const response = await fetch(`/Api/team/members?team_id=${user.user_team}`)
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
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchPriorities = async () => {
    setLoadingPriorities(true)
    try {
      const response = await fetch('/Api/priority')
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched priorities:", data.priorities)
        setPriorities(data.priorities || [])
        
        // Set default priority to first available
        if (data.priorities.length > 0) {
          setSelectedPriority(data.priorities[0].priority_id)
        }
      } else {
        console.error("Failed to fetch priorities")
        setPriorities([])
      }
    } catch (error) {
      console.error("Error fetching priorities:", error)
      setPriorities([])
    } finally {
      setLoadingPriorities(false)
    }
  }

  // Extract requirements from description when it changes
  React.useEffect(() => {
    const extractedRequirements = extractRequirementsFromDescription(description)
    setRequirements(prev => {
      const newReqs = extractedRequirements.filter(req => !prev.includes(req))
      return [...prev, ...newReqs]
    })
  }, [description])

  const extractRequirementsFromDescription = (text: string): string[] => {
    if (!text) return []
    
    const regex = /(?:\d+[\.\)]|\-|\*)\s*(.+?)\s*;/g
    const matches = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim())
    }
    
    return matches
  }

  const toggleRequirement = (req: string) => {
    setRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    )
  }

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const getMemberById = (id: string): Member | undefined => {
    return teamMembers.find(member => member.user_id === id)
  }

  const handleImportantCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const words = text.trim() ? text.trim().split(/\s+/) : []
    
    if (words.length <= 100 || text.length < importantComment.length) {
      setImportantComment(text)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isOverLimit) {
      alert("Important comment must be 100 words or less.")
      return
    }

    if (!user?.user_id || !user?.user_team) {
      alert("User information is missing. Please try again.")
      return
    }

    if (!selectedPriority) {
      alert("Please select a priority.")
      return
    }

    if (!taskId) {
      alert("Task ID is not generated. Please try again.")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      
      // Append all required fields
      formData.append('task_id', taskId)
      formData.append('task_title', title)
      formData.append('task_description', description)
      formData.append('assigned_to', selectedMembers.join(','))
      formData.append('priority', selectedPriority)
      formData.append('start_date', format(new Date(), "yyyy-MM-dd"))
      formData.append('complete_date', dueDate ? format(dueDate, "yyyy-MM-dd") : '')
      formData.append('comment', importantComment)
      formData.append('team_id', user.user_team)
      formData.append('assigned_by', user.user_id)

      // Handle file upload
      const fileInput = (e.currentTarget as HTMLFormElement).doc
      if (fileInput?.files?.[0]) {
        formData.append('task_document', fileInput.files[0])
      }

      console.log("Submitting form data with task ID:", taskId)

      const response = await fetch('/Api/Task', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Task Created Successfully:", result)
        alert("Task created successfully!")
        setOpen(false)
        resetForm()
      } else {
        const errorText = await response.text()
        console.error("Server error response:", errorText)
        let errorMessage = "Failed to create task"
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
          
          // If it's a duplicate ID error, generate a new ID
          if (errorData.error === "Task ID already exists") {
            console.log("Duplicate task ID detected, generating new ID...")
            generateTaskId() // Generate new ID but don't auto-retry
            errorMessage = "Task ID conflict. A new ID has been generated. Please try again."
          }
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        
        alert(`Failed to create task: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error creating task:", error)
      alert("An error occurred while creating the task. Check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setRequirements([])
    setSelectedMembers([])
    setDueDate(undefined)
    setImportantComment("")
    // Don't reset taskId here - it will be regenerated when dialog opens
    setSelectedPriority(priorities[0]?.priority_id || "")
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
    // Task ID is generated in the useEffect when open changes
  }

  const getPriorityColor = (priorityLevel: string) => {
    const level = priorityLevel.toLowerCase()
    
    switch (level) {
      case "high": return "bg-red-500"
      case "medium": return "bg-orange-500"
      case "low": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityName = (priorityLevel: string) => {
    return priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1).toLowerCase()
  }

  // Get the selected priority object
  const getSelectedPriority = () => {
    return priorities.find(p => p.priority_id === selectedPriority)
  }

  // Get the priority level for the selected priority
  const getSelectedPriorityLevel = () => {
    const priority = getSelectedPriority()
    return priority ? priority.priority_level : ""
  }

  // Render the selected value in the trigger
  const renderSelectedValue = () => {
    if (!selectedPriority) {
      return "Select priority"
    }
    
    const priority = getSelectedPriority()
    if (!priority) {
      return "Select priority"
    }
    
    return (
      <span className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority.priority_level)}`}></div>
        {getPriorityName(priority.priority_level)} Priority
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Task</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task ID */}
          <div className="grid gap-2">
            <Label htmlFor="taskId">Task ID</Label>
            <Input 
              id="taskId" 
              value={taskId} 
              disabled 
              className="bg-muted font-mono" 
              placeholder="Generating 6-digit ID..."
            />
            <p className="text-xs text-muted-foreground">
              6-digit task ID (auto-generated)
            </p>
          </div>

          {/* Task Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input 
              id="title" 
              name="title" 
              placeholder="Enter task title" 
              value={title}
              onChange={handleTitleChange}
              required 
            />
          </div>

          {/* Task Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Task Description *</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder={`Enter detailed description... Use numbered lists (1., 2., etc.) or bullet points (-, *) followed by a semicolon to create requirements.`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required 
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use numbered lists (1., 2.) or bullet points (-, *) followed by a semicolon (;) to create requirements
            </p>
          </div>

          {/* Automatically Extracted Requirements */}
          {requirements.length > 0 && (
            <div className="grid gap-3 p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Requirements (auto-extracted from description)</Label>
              <div className="space-y-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-background rounded border">
                    <Checkbox
                      id={`req-${index}`}
                      checked={true}
                      onCheckedChange={() => toggleRequirement(req)}
                    />
                    <label
                      htmlFor={`req-${index}`}
                      className="text-sm leading-none cursor-pointer flex-1"
                    >
                      {req}
                    </label>
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Requirements are automatically extracted when they end with a semicolon. Uncheck to remove.
              </p>
            </div>
          )}

          {/* Upload Document */}
          <div className="grid gap-2">
            <Label htmlFor="doc">Upload Document (Optional)</Label>
            <Input id="doc" name="doc" type="file" />
          </div>

          {/* Add Members */}
          <div className="grid gap-3">
            <Label>Add Team Members</Label>
            
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading team members...
              </div>
            ) : (
              <>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedMembers.map((memberId) => {
                      const member = getMemberById(memberId)
                      return member ? (
                        <Badge key={memberId} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.user_img} alt={member.user_name} />
                            <AvatarFallback className="text-xs">
                              {member.user_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {member.user_name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => toggleMember(memberId)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={teamMembers.length === 0}>
                    <Button variant="outline" className="justify-between">
                      <span>
                        {teamMembers.length === 0 ? "No team members available" : "Select Team Members"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <DropdownMenuItem 
                        key={member.user_id}
                        onSelect={(e) => {
                          e.preventDefault()
                          toggleMember(member.user_id)
                        }}
                        className="flex items-center gap-3 p-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user_img} alt={member.user_name} />
                            <AvatarFallback className="text-xs">
                              {member.user_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1">{member.user_name}</span>
                        </div>
                        {selectedMembers.includes(member.user_id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <p className="text-xs text-muted-foreground">
                  {selectedMembers.length} member(s) selected
                </p>
              </>
            )}
          </div>

          {/* Priority */}
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority *</Label>
            {loadingPriorities ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading priorities...
              </div>
            ) : (
              <Select 
                name="priority" 
                value={selectedPriority} 
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {renderSelectedValue()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.priority_id} value={priority.priority_id}>
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority.priority_level)}`}></div>
                        {getPriorityName(priority.priority_level)} Priority
                        <span className="text-xs text-muted-foreground ml-2">
                          (ID: {priority.priority_id})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start Date */}
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Input value={format(new Date(), "yyyy-MM-dd")} disabled className="bg-muted" />
          </div>

          {/* Due Date */}
          <div className="grid gap-2">
            <Label>Due Date (Optional)</Label>
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              className="rounded-md border"
            />
            {dueDate && (
              <p className="text-sm text-muted-foreground">
                Selected: {format(dueDate, "PPP")}
              </p>
            )}
          </div>

          {/* Important Comment */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="importantComment" className="font-semibold text-amber-600">
                Important Comment
              </Label>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className={`relative border rounded-lg p-1 ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <Textarea 
                id="importantComment"
                name="importantComment"
                value={importantComment}
                onChange={handleImportantCommentChange}
                placeholder="Add critical notes, urgent instructions, or key information that team members must know (maximum 100 words)..."
                rows={3}
                className={`border-0 bg-transparent resize-none focus-visible:ring-0 ${isOverLimit ? 'text-red-800' : 'text-amber-800'}`}
              />
              <div className={`flex justify-between items-center px-3 py-1 text-xs ${isOverLimit ? 'text-red-600' : 'text-amber-600'}`}>
                <span>
                  {isOverLimit ? (
                    <span className="font-semibold">⚠️ {wordCount - 100} words over limit!</span>
                  ) : (
                    <span>{wordsRemaining} words remaining</span>
                  )}
                </span>
                <span>{wordCount}/100 words</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This comment will be highlighted for all team members. Keep it concise and important.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isOverLimit || loading || !user?.user_team || !selectedPriority || !taskId}
              className={isOverLimit ? "bg-gray-400 cursor-not-allowed" : ""}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : isOverLimit ? (
                "Reduce Word Count"
              ) : !user?.user_team ? (
                "No Team Assigned"
              ) : !selectedPriority ? (
                "Select Priority"
              ) : !taskId ? (
                "Generating ID..."
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}