import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { createClient } from '@supabase/supabase-js';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const conditionTypes = [
  { value: 'retailer', label: 'Retailer' },
  { value: 'retailerGroup', label: 'Retailer Group' },
  { value: 'orderValue', label: 'Order Value' },
  { value: 'productCategory', label: 'Product Category' },
];

const operators = [
  { value: 'is', label: 'Is' },
  { value: 'isNot', label: 'Is Not' },
  { value: 'inGroup', label: 'In Group' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
];

export default function ConditionalNode({ data, isConnectable, selected }) {
  const [showConfig, setShowConfig] = useState(false);
  const [conditionType, setConditionType] = useState(data.conditionType || 'retailer');
  const [selectedRetailer, setSelectedRetailer] = useState(data.selectedRetailer || '');
  const [selectedGroup, setSelectedGroup] = useState(data.selectedGroup || '');
  const [operator, setOperator] = useState(data.operator || 'is');
  const [trueBranchLabel, setTrueBranchLabel] = useState(data.trueBranchLabel || 'True Path');
  const [falseBranchLabel, setFalseBranchLabel] = useState(data.falseBranchLabel || 'False Path');
  const [retailers, setRetailers] = useState([]);
  const [retailerGroups, setRetailerGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('individual');

  // Fetch retailers and retailer groups on mount
  useEffect(() => {
    async function fetchData() {
      // Fetch retailers
      const { data: retailersData } = await supabase
        .from('retailers')
        .select('id, business_name, email');
      
      if (retailersData) {
        setRetailers(retailersData);
      }
      
      // Fetch retailer groups
      const { data: groupsData } = await supabase
        .from('retailer_groups')
        .select('id, name');
      
      if (groupsData) {
        setRetailerGroups(groupsData);
      }
    }
    
    fetchData();
  }, []);

  // Update node data when configuration changes
  useEffect(() => {
    if (data.updateNodeInternals) {
      data.updateNodeInternals(data.id);
    }
  }, [data, conditionType, selectedRetailer, selectedGroup, operator, trueBranchLabel, falseBranchLabel]);

  // Get summary of the condition for display
  const getConditionSummary = () => {
    if (conditionType === 'retailer') {
      const retailer = retailers.find(r => r.id === selectedRetailer);
      return retailer 
        ? `If Retailer ${operator === 'is' ? 'is' : 'is not'} ${retailer.business_name}`
        : 'Configure condition...';
    }
    
    if (conditionType === 'retailerGroup') {
      const group = retailerGroups.find(g => g.id === selectedGroup);
      return group
        ? `If Retailer ${operator === 'is' ? 'is in' : 'is not in'} group "${group.name}"`
        : 'Configure condition...';
    }
    
    return 'Configure condition...';
  };

  // Save the configuration
  const saveConfiguration = () => {
    // Update the node data
    if (data.onChange) {
      data.onChange({
        ...data,
        conditionType,
        selectedRetailer,
        selectedGroup,
        operator,
        trueBranchLabel,
        falseBranchLabel
      });
    }
    
    setShowConfig(false);
  };

  return (
    <>
      <div className={`relative p-4 rounded-lg border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} bg-white shadow-md w-64`}>
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3 rounded-full bg-blue-500"
        />
        
        <div className="mb-2">
          <div className="text-sm font-semibold mb-1 text-gray-600">Condition</div>
          <div className="p-2 bg-orange-100 text-orange-800 rounded-md text-sm">
            {getConditionSummary()}
          </div>
        </div>
        
        <div className="flex justify-between text-xs mt-4">
          <div className="bg-green-100 px-2 py-1 rounded text-green-800">
            {trueBranchLabel}
          </div>
          <div className="bg-red-100 px-2 py-1 rounded text-red-800">
            {falseBranchLabel}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3"
          onClick={() => setShowConfig(true)}
        >
          Configure
        </Button>
        
        {/* True branch output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: '25%' }}
          isConnectable={isConnectable}
          className="w-3 h-3 rounded-full bg-green-500"
        />
        
        {/* False branch output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: '75%' }}
          isConnectable={isConnectable}
          className="w-3 h-3 rounded-full bg-red-500"
        />
      </div>
      
      {/* Configuration Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Conditional Logic Configuration</DialogTitle>
            <DialogDescription>
              Configure Conditional Logic
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="condition-type">Condition Type</Label>
              <Select 
                value={conditionType} 
                onValueChange={setConditionType}
              >
                <SelectTrigger id="condition-type">
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  {conditionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {conditionType === 'retailer' && (
              <>
                <div className="grid gap-2">
                  <Label>Select Retailer</Label>
                  <Select 
                    value={selectedRetailer} 
                    onValueChange={setSelectedRetailer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retailer" />
                    </SelectTrigger>
                    <SelectContent>
                      {retailers.map(retailer => (
                        <SelectItem key={retailer.id} value={retailer.id}>
                          {retailer.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Operator</Label>
                  <Select 
                    value={operator} 
                    onValueChange={setOperator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="is">Is</SelectItem>
                      <SelectItem value="isNot">Is Not</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {conditionType === 'retailerGroup' && (
              <>
                <div className="grid gap-2">
                  <Label>Select Retailer Group</Label>
                  <Select 
                    value={selectedGroup} 
                    onValueChange={setSelectedGroup}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retailer group" />
                    </SelectTrigger>
                    <SelectContent>
                      {retailerGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Operator</Label>
                  <Select 
                    value={operator} 
                    onValueChange={setOperator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="is">Is In</SelectItem>
                      <SelectItem value="isNot">Is Not In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="true-branch">True Branch Label</Label>
              <Select 
                value={trueBranchLabel} 
                onValueChange={setTrueBranchLabel}
              >
                <SelectTrigger id="true-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="True Path">True Path</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Match">Match</SelectItem>
                  <SelectItem value="Approve">Approve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="false-branch">False Branch Label</Label>
              <Select 
                value={falseBranchLabel} 
                onValueChange={setFalseBranchLabel}
              >
                <SelectTrigger id="false-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="False Path">False Path</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="No Match">No Match</SelectItem>
                  <SelectItem value="Reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfiguration}>
              Update Condition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 