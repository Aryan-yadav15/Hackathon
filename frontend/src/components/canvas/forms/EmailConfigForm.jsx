"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";
import { toast } from "sonner";

export default function EmailConfigForm({ onSave, initialData }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    email: initialData?.email || "",
    folder: initialData?.folder || "INBOX",
    is_verified: initialData?.is_verified || false,
  });

  const handleVerifyEmail = () => {
    setIsVerifying(true);
    
    // Use the environment variable directly to ensure exact matching
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;
    
    console.log("Using redirect URI:", redirectUri); // For debugging
    
    // Construct the OAuth URL
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://mail.google.com/&access_type=offline&prompt=consent&state=${emailConfig.email}`;
    
    // Debug: log the full constructed URL
    console.log("OAuth URL:", oauthUrl);
    
    // Make sure the email is set
    if (!emailConfig.email || emailConfig.email.trim() === "") {
      toast.error("Please enter an email address first");
      setIsVerifying(false);
      return;
    }
    
    // Navigate to the OAuth URL
    window.location.href = oauthUrl;
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
          <p className="text-xs text-gray-500 mt-1">
            Note: Use an email that's registered in the system as a manufacturer.
            Testing with: mailmeshupdates@gmail.com
          </p>
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
