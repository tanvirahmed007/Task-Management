// components/AddMemberDialog/AddMemberDialog.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Eye, EyeOff, RefreshCw } from "lucide-react";

interface User {
  user_id: string;
  user_name: string;
  user_team?: string;
}

interface Role {
  role_id: number;
  role_type: string;
}

interface AddMemberDialogProps {
  user: User;
  onMemberAdded: () => void;
}

export default function AddMemberDialog({ user, onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_name: "",
    user_designation: "",
    user_number: "",
    user_address: "",
    user_role: "",
    user_team: user.user_team || "",
    user_password: "",
    user_img: null as File | null
  });

  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Generate a numeric user ID only once when dialog opens
  const generateUserId = (): number => {
    return Math.floor(100000 + Math.random() * 9000);
  };

  // Fetch roles from database when dialog opens
  const fetchRoles = async () => {
    if (open) {
      setRolesLoading(true);
      setRolesError(null);
      try {
        console.log('Fetching roles from API...');
        const response = await fetch('/Api/roles');
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rolesData = await response.json();
        console.log('Roles loaded successfully:', rolesData);
        
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        } else {
          throw new Error('Invalid response format: Expected array but got ' + typeof rolesData);
        }
      } catch (error) {
        console.error("Error loading roles:", error);
        setRolesError(error instanceof Error ? error.message : 'Failed to load roles');
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [open]);

  // Initialize user ID when dialog opens
  useEffect(() => {
    if (open) {
      setUserId(generateUserId());
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, user_img: e.target.files![0] }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.stopPropagation();
    }
  };

  // Fixed: Prevent dialog from closing when clicking anywhere inside
  const handleInteractOutside = (e: Event) => {
    // Prevent closing when clicking anywhere outside the dialog
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', userId.toString());
      formDataToSend.append('user_name', formData.user_name);
      formDataToSend.append('user_designation', formData.user_designation);
      formDataToSend.append('user_number', formData.user_number);
      formDataToSend.append('user_address', formData.user_address);
      formDataToSend.append('user_role', formData.user_role);
      formDataToSend.append('user_team', formData.user_team);
      formDataToSend.append('user_password', formData.user_password);
      
      if (formData.user_img) {
        formDataToSend.append('user_img', formData.user_img);
      }

      const response = await fetch('/Api/users', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        setOpen(false);
        setFormData({
          user_name: "",
          user_designation: "",
          user_number: "",
          user_address: "",
          user_role: "",
          user_team: user.user_team || "",
          user_password: "",
          user_img: null
        });
        alert('User created successfully!');
        onMemberAdded();
      } else {
        alert(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({
      user_name: "",
      user_designation: "",
      user_number: "",
      user_address: "",
      user_role: "",
      user_team: user.user_team || "",
      user_password: "",
      user_img: null
    });
    setRolesError(null);
  };

  // Handle click on form elements to prevent propagation
  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full text-green-600 border-green-600 hover:bg-green-50 justify-start"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          + Add Member to Team
        </Button>
      </DialogTrigger>
      <DialogContent 
        ref={dialogContentRef}
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        onInteractOutside={handleInteractOutside} // This prevents closing when clicking outside
        onPointerDownOutside={(e) => e.preventDefault()} // Additional prevention for pointer events
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing with Escape key if desired
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold">Add New Team Member</DialogTitle>
          <DialogClose asChild>
            
          </DialogClose>
        </DialogHeader>
        
        <form 
          onSubmit={handleSubmit} 
          className="space-y-6 py-4" 
          onKeyDown={handleKeyDown}
          onClick={handleFormClick} // Prevent click propagation
        >
          {/* User ID and Team ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_id" className="font-medium">User ID</Label>
              <Input
                id="user_id"
                name="user_id"
                value={userId}
                disabled
                className="bg-gray-100 font-mono"
                onClick={(e) => e.stopPropagation()} // Additional protection
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_team" className="font-medium">Team ID</Label>
              <Input
                id="user_team"
                name="user_team"
                value={formData.user_team}
                disabled
                className="bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Name and Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_name" className="font-medium">Full Name *</Label>
              <Input
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_designation" className="font-medium">Designation *</Label>
              <Input
                id="user_designation"
                name="user_designation"
                value={formData.user_designation}
                onChange={handleInputChange}
                required
                placeholder="Enter designation"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Phone Number and Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_number" className="font-medium">Phone Number *</Label>
              <Input
                id="user_number"
                name="user_number"
                type="tel"
                value={formData.user_number}
                onChange={handleInputChange}
                required
                placeholder="Enter phone number"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_role" className="font-medium">Role *</Label>
              
              {rolesError ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 text-red-600">
                    <span>Failed to load roles</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchRoles}
                      className="h-6 px-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                  <p className="text-xs text-red-500">{rolesError}</p>
                  {/* Fallback roles with valid values */}
                  <Select 
                    value={formData.user_role} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, user_role: value }))}
                  >
                    <SelectTrigger onClick={(e) => e.stopPropagation()}>
                      <SelectValue placeholder="Select role (using fallback)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2222">Admin (2222)</SelectItem>
                      <SelectItem value="3333">Manager (3333)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select 
                  value={formData.user_role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_role: value }))}
                  disabled={rolesLoading}
                >
                  <SelectTrigger onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role.role_id} value={role.role_id.toString()}>
                          {role.role_type} ({role.role_id})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-roles" disabled>
                        No roles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200" onClick={(e) => e.stopPropagation()}>
            <Label htmlFor="user_password" className="font-medium text-yellow-800">Password *</Label>
            <div className="relative">
              <Input
                id="user_password"
                name="user_password"
                type={showPassword ? "text" : "password"}
                value={formData.user_password}
                onChange={handleInputChange}
                required
                placeholder="Enter password for the new user"
                className="pr-10 border-yellow-300 focus:border-yellow-500"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Eye className="h-4 w-4 text-yellow-600" />
                )}
              </Button>
            </div>
            <p className="text-xs text-yellow-700">Password is required for user login</p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="user_address" className="font-medium">Address</Label>
            <textarea
              id="user_address"
              name="user_address"
              value={formData.user_address}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="user_img" className="font-medium">Profile Image</Label>
            <Input
              id="user_img"
              name="user_img"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-muted-foreground">Upload a profile picture (optional)</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.user_name || !formData.user_designation || !formData.user_number || !formData.user_role || !formData.user_password}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Create Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}