"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState('');
  const [selectedRetailers, setSelectedRetailers] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [manufacturerId, setManufacturerId] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Simple toast alternative
  const showToast = (title, message, type = 'info') => {
    console.log(`${title}: ${message}`);
    // You could replace this with a more sophisticated UI notification
    if (type === 'error' || type === 'destructive') {
      alert(`${title}: ${message}`);
    }
  };

  // Fetch current manufacturer ID - TEMPORARY FIX: Get first manufacturer
  useEffect(() => {
    async function getManufacturerId() {
      try {
        // Try to get the manufacturer from auth session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Auth session:", session ? "Available" : "Not available");
        
        if (sessionError) {
          console.error("Auth session error:", sessionError);
          setAuthError(sessionError.message);
        }
        
        if (session && session.user) {
          console.log("User ID from session:", session.user.id);
          // Fetch the manufacturer record associated with the logged-in user
          const { data, error } = await supabase
            .from('manufacturers')
            .select('id')
            .eq('clerk_id', session.user.id)
            .single();
          
          if (data) {
            console.log("Found manufacturer ID:", data.id);
            setManufacturerId(data.id);
            return;
          } else {
            console.error('Could not find manufacturer by clerk_id:', error);
          }
        }
        
        // Fallback: Get the first manufacturer as a temporary solution
        console.log("Falling back to first manufacturer");
        const { data: firstManufacturer, error: manufacturerError } = await supabase
          .from('manufacturers')
          .select('id')
          .limit(1)
          .single();
        
        if (firstManufacturer) {
          console.log("Using first manufacturer ID:", firstManufacturer.id);
          setManufacturerId(firstManufacturer.id);
        } else {
          console.error("No manufacturers found:", manufacturerError);
          setAuthError("No manufacturers found in the system");
        }
      } catch (err) {
        console.error("Error getting manufacturer ID:", err);
        setAuthError(err.message);
      }
    }
    
    getManufacturerId();
  }, []);

  // Fetch retailers and retailer groups
  useEffect(() => {
    async function fetchData() {
      if (!manufacturerId) {
        console.log("No manufacturer ID available, skipping data fetch");
        return;
      }
      
      console.log("Fetching data for manufacturer:", manufacturerId);
      setLoading(true);
      
      try {
        // Fetch retailers
        const { data: retailersData, error: retailersError } = await supabase
          .from('retailers')
          .select('*')
          .eq('manufacturer_id', manufacturerId);
        
        if (retailersError) {
          console.error("Error fetching retailers:", retailersError);
          showToast("Error", "Failed to load retailers: " + retailersError.message, "error");
          setLoading(false);
          return;
        }
        
        console.log(`Found ${retailersData ? retailersData.length : 0} retailers`);
        
        // Fetch retailer groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('retailer_groups')
          .select('*')
          .eq('manufacturer_id', manufacturerId);
        
        if (groupsError) {
          console.error("Error fetching groups:", groupsError);
          showToast("Error", "Failed to load retailer groups: " + groupsError.message, "error");
        } else {
          console.log(`Found ${groupsData ? groupsData.length : 0} retailer groups`);
          setGroups(groupsData || []);
        }
        
        // Fetch group memberships
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('retailer_group_members')
          .select('*');
        
        if (membershipsError) {
          console.error("Error fetching group memberships:", membershipsError);
        } else {
          console.log(`Found ${membershipsData ? membershipsData.length : 0} group memberships`);
        }
        
        if (!membershipsError && membershipsData && retailersData) {
          // Add group information to each retailer
          const retailersWithGroups = retailersData.map(retailer => {
            const retailerGroups = membershipsData
              .filter(m => m.retailer_id === retailer.id)
              .map(m => {
                const group = groupsData && groupsData.find(g => g.id === m.group_id);
                return group ? group.name : null;
              })
              .filter(Boolean);
            
            return {
              ...retailer,
              groups: retailerGroups
            };
          });
          
          setRetailers(retailersWithGroups);
        } else {
          setRetailers(retailersData || []);
        }
      } catch (err) {
        console.error("Unexpected error in fetchData:", err);
        showToast("Error", "An unexpected error occurred: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [manufacturerId]);
  
  // Create a new retailer group
  const createRetailerGroup = async () => {
    if (!manufacturerId) {
      showToast("Error", "Manufacturer ID not available", "error");
      return;
    }
    
    if (!newGroup.trim()) {
      showToast("Error", "Please enter a group name", "error");
      return;
    }
    
    console.log("Creating group for manufacturer:", manufacturerId);
    
    const { data, error } = await supabase
      .from('retailer_groups')
      .insert([
        { 
          name: newGroup, 
          description: `Group for ${newGroup}`,
          manufacturer_id: manufacturerId
        }
      ])
      .select();
    
    if (error) {
      console.error("Error creating group:", error);
      showToast("Error", "Failed to create group: " + error.message, "error");
    } else {
      console.log("Group created successfully:", data[0]);
      showToast("Success", "Retailer group created successfully");
      setGroups([...groups, data[0]]);
      setNewGroup('');
      setShowCreateDialog(false);
    }
  };
  
  // Assign retailers to a group
  const assignRetailersToGroup = async () => {
    if (!editingGroup) {
      showToast("Error", "Please select a group", "error");
      return;
    }
    
    const selectedRetailerIds = Object.entries(selectedRetailers)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => parseInt(id)); // Convert string IDs to integers
    
    if (selectedRetailerIds.length === 0) {
      showToast("Error", "Please select at least one retailer", "error");
      return;
    }
    
    // First, remove existing memberships for this group
    await supabase
      .from('retailer_group_members')
      .delete()
      .eq('group_id', editingGroup);
    
    // Then add the new memberships
    const memberships = selectedRetailerIds.map(retailerId => ({
      group_id: editingGroup,
      retailer_id: retailerId
    }));
    
    const { error } = await supabase
      .from('retailer_group_members')
      .insert(memberships);
    
    if (error) {
      showToast("Error", "Failed to assign retailers: " + error.message, "error");
    } else {
      showToast("Success", "Retailers assigned to group successfully");
      setShowAssignDialog(false);
      
      // Refresh the retailer list to show updated groups
      const { data: retailersData } = await supabase
        .from('retailers')
        .select('*')
        .eq('manufacturer_id', manufacturerId);
      
      const { data: membershipsData } = await supabase
        .from('retailer_group_members')
        .select('*');
      
      if (retailersData && membershipsData) {
        const retailersWithGroups = retailersData.map(retailer => {
          const retailerGroups = membershipsData
            .filter(m => m.retailer_id === retailer.id)
            .map(m => {
              const group = groups.find(g => g.id === m.group_id);
              return group ? group.name : null;
            })
            .filter(Boolean);
          
          return {
            ...retailer,
            groups: retailerGroups
          };
        });
        
        setRetailers(retailersWithGroups);
      }
    }
  };
  
  // Load retailers in a group when editing
  const loadRetailersInGroup = async (groupId) => {
    setEditingGroup(groupId);
    
    const { data, error } = await supabase
      .from('retailer_group_members')
      .select('retailer_id')
      .eq('group_id', groupId);
    
    if (!error && data) {
      const newSelectedRetailers = {};
      retailers.forEach(retailer => {
        newSelectedRetailers[retailer.id] = data.some(m => m.retailer_id === retailer.id);
      });
      setSelectedRetailers(newSelectedRetailers);
    } else {
      const newSelectedRetailers = {};
      retailers.forEach(retailer => {
        newSelectedRetailers[retailer.id] = false;
      });
      setSelectedRetailers(newSelectedRetailers);
    }
    
    setShowAssignDialog(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Retailer Management</h1>
        <div className="space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Group
          </Button>
        </div>
      </div>
      
      {authError && (
        <Card className="mb-8 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{authError}</p>
            <p className="mt-2">This could be due to not being logged in or not having proper permissions.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Retailer Groups Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Retailer Groups</CardTitle>
          <CardDescription>Manage your retailer groups for workflow conditions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center">
              <p>Loading groups...</p>
              <p className="text-sm text-muted-foreground mt-2">
                {manufacturerId ? `Loading data for manufacturer ID: ${manufacturerId}` : 'Waiting for manufacturer ID...'}
              </p>
            </div>
          ) : groups.length === 0 ? (
            <p>No retailer groups found. Create a group to get started.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <Card key={group.id} className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description || 'No description'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadRetailersInGroup(group.id)}
                    >
                      Manage Members
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Retailers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Retailers</CardTitle>
          <CardDescription>All retailers in your network</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center">
              <p>Loading retailers...</p>
            </div>
          ) : retailers.length === 0 ? (
            <div>
              <p>No retailers found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                You need to have retailers in your system before you can create groups.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Groups</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retailers.map(retailer => (
                  <TableRow key={retailer.id}>
                    <TableCell className="font-medium">{retailer.business_name}</TableCell>
                    <TableCell>{retailer.email}</TableCell>
                    <TableCell>{retailer.contact_name}</TableCell>
                    <TableCell>
                      {retailer.groups && retailer.groups.length > 0
                        ? retailer.groups.join(', ')
                        : 'None'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Retailer Group</DialogTitle>
            <DialogDescription>
              Create a group to categorize retailers for your workflow conditions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createRetailerGroup} disabled={!manufacturerId}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Retailers Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Group Members</DialogTitle>
            <DialogDescription>
              Select the retailers that should be part of this group.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retailers.map(retailer => (
                  <TableRow key={retailer.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedRetailers[retailer.id] || false}
                        onChange={(e) => {
                          setSelectedRetailers({
                            ...selectedRetailers,
                            [retailer.id]: e.target.checked
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{retailer.business_name}</TableCell>
                    <TableCell>{retailer.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={assignRetailersToGroup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 