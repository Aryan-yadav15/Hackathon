'use client';

import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useWorkflow } from '@/context/WorkflowContext';
import { supabase } from '@/lib/supabase';
import { FaUsers, FaChevronDown } from 'react-icons/fa';

export default function RetailerGroupNode({ id, data, isConnectable, selected }) {
  const { setSelectedNode } = useWorkflow();
  const [retailerGroups, setRetailerGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(data.selectedGroups || []);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch retailer groups from database
  useEffect(() => {
    const fetchGroups = async () => {
      const { data: groups, error } = await supabase
        .from('retailer_groups')
        .select('id, name, description')
        .order('name', { ascending: true });
      
      if (groups) setRetailerGroups(groups);
    };
    fetchGroups();
  }, []);

  // Update node data when group selection changes
  useEffect(() => {
    if (data.updateNodeInternals) {
      data.updateNodeInternals(id);
    }
    data.selectedGroups = selectedGroups;
  }, [data, selectedGroups]);

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  return (
    <div 
      className={`px-4 py-2 shadow-md rounded-lg border-2 border-purple-500 bg-purple-50 ${
        selected ? 'ring-2 ring-blue-400' : ''
      } min-w-[200px]`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNode({ id, type: 'retailer_group', data });
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-500 w-3 h-3"
      />
      
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-2">
          <FaUsers className="text-purple-500" />
          Group Rules
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-600">Select retailer groups:</div>
          <div className="max-h-[200px] overflow-y-auto">
            {retailerGroups.map(group => (
              <label 
                key={group.id}
                className="flex items-center space-x-2 p-1 hover:bg-purple-100 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="form-checkbox h-4 w-4 text-purple-600"
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 w-3 h-3 hover:!bg-green-500"
        isConnectable={isConnectable}
      />
    </div>
  );
} 