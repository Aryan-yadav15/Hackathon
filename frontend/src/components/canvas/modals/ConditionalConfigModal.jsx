"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useManufacturer } from '@/hooks/useManufacturer';

export default function ConditionalConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const { manufacturer } = useManufacturer();
  const [conditionalConfig, setConditionalConfig] = useState({
    conditions: initialData?.conditions || [],
    condition_type: initialData?.condition_type || 'all', // 'all' means AND, 'any' means OR
    manufacturer_id: manufacturer?.id
  });
  const [newCondition, setNewCondition] = useState({
    field: 'email_sender',
    operator: 'equals',
    value: ''
  });

  // Update config when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setConditionalConfig(prev => ({
        ...prev,
        manufacturer_id: manufacturer.id
      }));
    }
  }, [manufacturer]);

  const handleAddCondition = () => {
    if (!newCondition.value) return;

    const updatedConditions = [
      ...conditionalConfig.conditions,
      {
        id: crypto.randomUUID(),
        field: newCondition.field,
        operator: newCondition.operator,
        value: newCondition.value
      }
    ];

    setConditionalConfig(prev => ({
      ...prev,
      conditions: updatedConditions
    }));

    setNewCondition({
      field: 'email_sender',
      operator: 'equals',
      value: ''
    });
  };

  const handleRemoveCondition = (conditionId) => {
    const updatedConditions = conditionalConfig.conditions.filter(
      condition => condition.id !== conditionId
    );
    
    setConditionalConfig(prev => ({
      ...prev,
      conditions: updatedConditions
    }));
  };

  const handleSubmit = () => {
    onSave({
      ...conditionalConfig,
      configured: true,
      type: 'conditional',
      label: 'Conditional Logic',
      conditionCount: conditionalConfig.conditions.length
    });
    
    if (!isFormView) {
      onClose();
    }
  };

  const fieldOptions = [
    { value: 'email_sender', label: 'Email Sender' },
    { value: 'email_subject', label: 'Email Subject' },
    { value: 'email_body', label: 'Email Body' },
    { value: 'product_sku', label: 'Product SKU' },
    { value: 'product_price', label: 'Product Price' },
    { value: 'order_total', label: 'Order Total' }
  ];
  
  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' }
  ];

  const getFieldLabel = (value) => {
    const field = fieldOptions.find(f => f.value === value);
    return field ? field.label : value;
  };
  
  const getOperatorLabel = (value) => {
    const operator = operatorOptions.find(o => o.value === value);
    return operator ? operator.label : value;
  };

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className={isFormView ? "text-lg font-medium mb-4" : "hidden"}>Conditional Logic</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition-type">Condition Type</Label>
            <Select
              value={conditionalConfig.condition_type}
              onValueChange={(value) => setConditionalConfig(prev => ({ ...prev, condition_type: value }))}
            >
              <SelectTrigger id="condition-type">
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All conditions must match (AND)</SelectItem>
                <SelectItem value="any">Any condition can match (OR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <Label htmlFor="condition-field">Field</Label>
              <Select
                value={newCondition.field}
                onValueChange={(value) => setNewCondition(prev => ({ ...prev, field: value }))}
              >
                <SelectTrigger id="condition-field">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label htmlFor="condition-operator">Operator</Label>
              <Select
                value={newCondition.operator}
                onValueChange={(value) => setNewCondition(prev => ({ ...prev, operator: value }))}
              >
                <SelectTrigger id="condition-operator">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label htmlFor="condition-value">Value</Label>
              <Input
                id="condition-value"
                value={newCondition.value}
                onChange={(e) => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Value"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                onClick={handleAddCondition}
                disabled={!newCondition.value}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Conditions ({conditionalConfig.conditions.length})</h4>
            {conditionalConfig.conditions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No conditions added yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {conditionalConfig.conditions.map((condition) => {
                  return (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{getFieldLabel(condition.field)}</span>
                          {' '}
                          <span className="text-gray-500">{getOperatorLabel(condition.operator)}</span>
                          {' '}
                          <span className="font-medium">"{condition.value}"</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {isFormView && (
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isFormView) {
    return renderContent();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Conditional Logic</DialogTitle>
        </DialogHeader>
        
        {renderContent()}
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 