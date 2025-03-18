"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";

export default function EmailConfigForm({ onSave, initialData }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    email: initialData?.email || "",
    folder: initialData?.folder || "INBOX",
    is_verified: initialData?.is_verified || false,
  });

  const handleVerifyEmail = () => {
    setIsVerifying(true);
    
    // Use the current site URL instead of hardcoded localhost
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUri = currentOrigin + '/api/oauth2callback';
    
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://mail.google.com/&access_type=offline&prompt=consent&state=${emailConfig.email}`;
  };

  const handleSave = () => {
    // Prepare the complete configuration data
    const configData = {
      ...emailConfig,
      type: 'email',
      label: 'Email Configuration',
      configured: true
    };
    
    onSave(configData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email to track"
              value={emailConfig.email}
              onChange={(e) =>
                setEmailConfig((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
            <Button
              onClick={handleVerifyEmail}
              disabled={!emailConfig.email || isVerifying}
              variant="secondary"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Folder to Monitor</label>
          <Input
            placeholder="Email folder (e.g., INBOX)"
            value={emailConfig.folder}
            onChange={(e) => setEmailConfig(prev => ({
              ...prev,
              folder: e.target.value
            }))}
          />
        </div>
        <Button 
          onClick={handleSave}
          className="w-full mt-4" 
          disabled={!emailConfig.email}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
