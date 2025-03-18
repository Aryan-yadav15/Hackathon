"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";

export default function PriceAdjustmentConfigForm({ onSave, initialData }) {
  const supabase = useSupabase();
  const { manufacturer } = useManufacturer();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [adjustment, setAdjustment] = useState({
    adjustmentType: initialData?.adjustmentType || "percentage",
    targetType: initialData?.targetType || "specific_product",
    productId: initialData?.productId || "",
    value: initialData?.value || "",
    reason: initialData?.reason || ""
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('manufacturer_id', manufacturer.id);
      
      setProducts(productData || []);
      setLoading(false);
    };
    
    if (manufacturer?.id) {
      fetchProducts();
    }
  }, [manufacturer, supabase]);

  const adjustmentTypes = [
    { id: "percentage", label: "Percentage" },
    { id: "fixed_amount", label: "Fixed Amount" }
  ];

  const targetTypes = [
    { id: "all_products", label: "All Products" },
    { id: "specific_product", label: "Specific Product" }
  ];

  const handleSave = () => {
    onSave({
      adjustmentType: adjustment.adjustmentType,
      targetType: adjustment.targetType,
      productId: adjustment.productId,
      value: adjustment.value,
      reason: adjustment.reason,
      configured: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Configure Price Adjustment</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Adjustment Type</label>
          <Select
            value={adjustment.adjustmentType}
            onValueChange={(value) => setAdjustment({...adjustment, adjustmentType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select adjustment type" />
            </SelectTrigger>
            <SelectContent>
              {adjustmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Type</label>
          <Select
            value={adjustment.targetType}
            onValueChange={(value) => setAdjustment({...adjustment, targetType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target type" />
            </SelectTrigger>
            <SelectContent>
              {targetTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {adjustment.targetType === "specific_product" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Product</label>
            <Select
              value={adjustment.productId}
              onValueChange={(value) => setAdjustment({...adjustment, productId: value})}
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
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {adjustment.adjustmentType === "percentage" ? "Percentage Value (%)" : "Amount"}
          </label>
          <Input
            type="number"
            value={adjustment.value}
            onChange={(e) => setAdjustment({...adjustment, value: e.target.value})}
            placeholder={adjustment.adjustmentType === "percentage" ? "Enter percentage" : "Enter amount"}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason/Description</label>
          <Input
            value={adjustment.reason}
            onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
            placeholder="Why is this adjustment being applied?"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full"
        disabled={!adjustment.adjustmentType || !adjustment.targetType || 
          (adjustment.targetType === "specific_product" && !adjustment.productId) || 
          !adjustment.value}
      >
        {initialData?.configured ? 'Update Price Adjustment' : 'Save Price Adjustment'}
      </Button>
    </div>
  );
} 