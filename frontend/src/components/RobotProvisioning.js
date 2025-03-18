{
  /**
    This implementation assumes:
1. Frontend provides a UI for manufacturers to initiate robot setup --
             need to change this so that it is handeled in email modal in canvas
2. Backend handles the UiPath Orchestrator API integration -uipathServices.js
3. Pre-built workflow packages are stored and injected with dynamic email
UiPath cloud API endpoints are properly configured
Key integration points would be:
Authentication with UiPath cloud
Dynamic package creation with email parameter
Robot job monitoring
Error handling and status updates
Would you like me to explain any specific part in more detail? */
}

import { useState } from "react";
import { useManufacturer } from "@/hooks/useManufacturer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RobotProvisioning() {
  const { manufacturer } = useManufacturer();
  const [email, setEmail] = useState(manufacturer?.email || "");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [status, setStatus] = useState("idle");

  const initiateRobotSetup = async () => {
    setIsProvisioning(true);
    try {
      // 1. Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format");
      }

      // 2. Start provisioning process
      setStatus("Initializing robot template...");
      const res = await fetch("/api/uipath/provision-robot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ manufacturer_email: email }),
      });

      if (!res.ok) throw new Error("Provisioning failed");

      const { jobId } = await res.json();

      // 3. Poll for job status
      setStatus("Packaging workflow...");
      const interval = setInterval(async () => {
        const statusRes = await fetch(`/api/uipath/job-status/${jobId}`);
        const { state } = await statusRes.json();

        if (state === "Successful") {
          clearInterval(interval);
          setStatus("Provisioning complete!");
          toast.success("Robot deployed successfully");
        } else if (state === "Faulted") {
          clearInterval(interval);
          setStatus("Provisioning failed");
          toast.error("Robot deployment failed");
        }
      }, 2000);
    } catch (error) {
      toast.error(error.message);
      setStatus("Error occurred");
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">UiPath Robot Setup</h3>

      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Manufacturer email"
          className="max-w-xs"
        />

        <Button onClick={initiateRobotSetup} disabled={isProvisioning}>
          {isProvisioning ? "Provisioning..." : "Deploy Robot"}
        </Button>
      </div>

      {status && (
        <div className="text-sm text-muted-foreground">Status: {status}</div>
      )}

      <p className="text-sm text-muted-foreground">
        This will create a UiPath robot instance pre-configured with:
        <ul className="list-disc pl-6 mt-2">
          <li>Email monitoring workflow</li>
          <li>Dynamic email address binding</li>
          <li>Order processing automation</li>
          <li>Exception handling routines</li>
        </ul>
      </p>
    </div>
  );
}
