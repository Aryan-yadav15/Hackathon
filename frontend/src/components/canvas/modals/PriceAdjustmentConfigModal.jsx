"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useManufacturer } from '@/hooks/useManufacturer';

export default function PriceAdjustmentConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const { manufacturer } = useManufacturer();
  const [priceConfig, setPriceConfig] = useState({
    adjustments: initialData?.adjustments || [],
    default_adjustment: initialData?.default_adjustment || null,
    manufacturer_id: manufacturer?.id
  });
  const [newAdjustment, setNewAdjustment] = useState({
    type: 'percentage',
    value: '',
    sku_pattern: '',
    customer_type: 'all'
  });

  // Update config when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setPriceConfig(prev => ({
        ...prev,
        manufacturer_id: manufacturer.id
      }));
    }
  }, [manufacturer]);

  const handleAddAdjustment = () => {
    if (!newAdjustment.value) return;

    const updatedAdjustments = [
      ...priceConfig.adjustments,
      {
        id: crypto.randomUUID(),
        type: newAdjustment.type,
        value: parseFloat(newAdjustment.value) || 0,
        sku_pattern: newAdjustment.sku_pattern,
        customer_type: newAdjustment.customer_type
      }
    ];

    setPriceConfig(prev => ({
      ...prev,
      adjustments: updatedAdjustments
    }));

    setNewAdjustment({
      type: 'percentage',
      value: '',
      sku_pattern: '',
      customer_type: 'all'
    });
  };

  const handleRemoveAdjustment = (adjustmentId) => {
    const updatedAdjustments = priceConfig.adjustments.filter(
      adjustment => adjustment.id !== adjustmentId
    );
    
    setPriceConfig(prev => ({
      ...prev,
      adjustments: updatedAdjustments
    }));
  };

  const handleSubmit = () => {
    onSave({
      ...priceConfig,
      configured: true,
      type: 'price_adjustment',
      label: 'Price Adjustment',
      adjustmentCount: priceConfig.adjustments.length
    });
    
    if (!isFormView) {
      onClose();
    }
  };

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className={isFormView ? "text-lg font-medium mb-4" : "hidden"}>Price Adjustment Rules</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <Label htmlFor="adjustment-type">Type</Label>
              <Select
                value={newAdjustment.type}
                onValueChange={(value) => setNewAdjustment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="adjustment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="markup">Markup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="adjustment-value">Value</Label>
              <Input
                id="adjustment-value"
                type="number"
                value={newAdjustment.value}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, value: e.target.value }))}
                placeholder={newAdjustment.type === 'percentage' ? '10' : '5.00'}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor="adjustment-sku">SKU Pattern (Optional)</Label>
              <Input
                id="adjustment-sku"
                value={newAdjustment.sku_pattern}
                onChange={(e) => setNewAdjustment(prev => ({ ...prev, sku_pattern: e.target.value }))}
                placeholder="ABC* or leave empty"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="adjustment-customer">Customer</Label>
              <Select
                value={newAdjustment.customer_type}
                onValueChange={(value) => setNewAdjustment(prev => ({ ...prev, customer_type: value }))}
              >
                <SelectTrigger id="adjustment-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="new">New Customers</SelectItem>
                  <SelectItem value="returning">Returning Customers</SelectItem>
                  <SelectItem value="vip">VIP Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                onClick={handleAddAdjustment}
                disabled={!newAdjustment.value}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Price Adjustments ({priceConfig.adjustments.length})</h4>
            {priceConfig.adjustments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No adjustments added yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {priceConfig.adjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {adjustment.type === 'percentage' ? `${adjustment.value}% ${adjustment.value >= 0 ? 'increase' : 'discount'}` : 
                         adjustment.type === 'fixed' ? `$${Math.abs(adjustment.value).toFixed(2)} ${adjustment.value >= 0 ? 'additional' : 'discount'}` :
                         `${adjustment.value}% markup`}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        {adjustment.sku_pattern && <span>SKU: {adjustment.sku_pattern}</span>}
                        <span>For: {adjustment.customer_type === 'all' ? 'All customers' : 
                                     adjustment.customer_type === 'new' ? 'New customers' :
                                     adjustment.customer_type === 'returning' ? 'Returning customers' :
                                     'VIP customers'}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAdjustment(adjustment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
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
          <DialogTitle>Price Adjustment Rules</DialogTitle>
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