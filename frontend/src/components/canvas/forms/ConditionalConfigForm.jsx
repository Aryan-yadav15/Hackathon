"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";

export default function ConditionalConfigForm({ onSave, initialData }) {
  const supabase = useSupabase();
  const { manufacturer } = useManufacturer();
  
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [condition, setCondition] = useState({
    conditionType: initialData?.conditionType || "retailer",
    entityId: initialData?.entityId || "",
    operator: initialData?.operator || "equals",
    value: initialData?.value || "",
    trueBranchLabel: initialData?.trueBranchLabel || "True Path",
    falseBranchLabel: initialData?.falseBranchLabel || "False Path"
  });

  // Fetch retailers and products for condition options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch retailers
      const { data: retailerData } = await supabase
        .from('retailers')
        .select('*')
        .eq('manufacturer_id', manufacturer.id);
      
      // Fetch products
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('manufacturer_id', manufacturer.id);
      
      setRetailers(retailerData || []);
      setProducts(productData || []);
      setLoading(false);
    };
    
    if (manufacturer?.id) {
      fetchData();
    }
  }, [manufacturer, supabase]);

  const conditionTypes = [
    { id: "retailer", label: "Retailer" },
    { id: "product", label: "Product" },
    { id: "order_value", label: "Order Value" },
    { id: "order_quantity", label: "Order Quantity" },
    { id: "retailer_group", label: "Retailer Group" }
  ];

  const operatorOptions = {
    retailer: [
      { id: "equals", label: "Is" },
      { id: "not_equals", label: "Is Not" }
    ],
    product: [
      { id: "contains", label: "Contains" },
      { id: "not_contains", label: "Does Not Contain" }
    ],
    order_value: [
      { id: "greater_than", label: "Greater Than" },
      { id: "less_than", label: "Less Than" },
      { id: "equals", label: "Equals" }
    ],
    order_quantity: [
      { id: "greater_than", label: "Greater Than" },
      { id: "less_than", label: "Less Than" },
      { id: "equals", label: "Equals" }
    ],
    retailer_group: [
      { id: "in_group", label: "Is In Group" },
      { id: "not_in_group", label: "Is Not In Group" }
    ]
  };

  const handleSave = () => {
    onSave({
      conditionType: condition.conditionType,
      entityId: condition.entityId,
      operator: condition.operator,
      value: condition.value,
      trueBranchLabel: condition.trueBranchLabel,
      falseBranchLabel: condition.falseBranchLabel,
      configured: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Configure Conditional Logic</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition Type</label>
          <Select
            value={condition.conditionType}
            onValueChange={(value) => setCondition({
              ...condition,
              conditionType: value,
              operator: operatorOptions[value][0].id // Default to first operator
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition type" />
            </SelectTrigger>
            <SelectContent>
              {conditionTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {condition.conditionType === "retailer" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Retailer</label>
            <Select
              value={condition.entityId}
              onValueChange={(value) => setCondition({...condition, entityId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select retailer" />
              </SelectTrigger>
              <SelectContent>
                {retailers.map((retailer) => (
                  <SelectItem key={retailer.id} value={retailer.id.toString()}>
                    {retailer.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {condition.conditionType === "product" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Product</label>
            <Select
              value={condition.entityId}
              onValueChange={(value) => setCondition({...condition, entityId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {(condition.conditionType === "order_value" || condition.conditionType === "order_quantity") && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            <Input
              type="number"
              value={condition.value}
              onChange={(e) => setCondition({...condition, value: e.target.value})}
              placeholder={condition.conditionType === "order_value" ? "Enter amount" : "Enter quantity"}
            />
          </div>
        )}
        
        {condition.conditionType === "retailer_group" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Retailer Group</label>
            <Select
              value={condition.entityId}
              onValueChange={(value) => setCondition({...condition, entityId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {retailers.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Operator</label>
          <Select
            value={condition.operator}
            onValueChange={(value) => setCondition({...condition, operator: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operatorOptions[condition.conditionType]?.map((op) => (
                <SelectItem key={op.id} value={op.id}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">True Branch Label</label>
          <Input
            value={condition.trueBranchLabel}
            onChange={(e) => setCondition({...condition, trueBranchLabel: e.target.value})}
            placeholder="Label for true condition"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">False Branch Label</label>
          <Input
            value={condition.falseBranchLabel}
            onChange={(e) => setCondition({...condition, falseBranchLabel: e.target.value})}
            placeholder="Label for false condition"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full"
        disabled={!condition.conditionType || !condition.operator || 
          (condition.conditionType !== "retailer" && condition.conditionType !== "product" && !condition.value) || 
          (condition.conditionType === "retailer" && !condition.entityId) ||
          (condition.conditionType === "product" && !condition.entityId)}
      >
        {initialData?.configured ? 'Update Condition' : 'Save Condition'}
      </Button>
    </div>
  );
} 