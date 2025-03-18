'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// This custom hook MUST be used in a client component.
// Do not call it from a server component.
export function useManufacturer() {
  // Calling useUser unconditionally at the top level is required.
  const { isLoaded, user } = useUser();
  
  const [manufacturer, setManufacturer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchManufacturer() {
      // Only fetch when user is loaded and available.
      if (!isLoaded || !user) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/manufacturers');
        const data = await response.json();

        if (!isMounted) return;

        if (response.ok) {
          setManufacturer(data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchManufacturer();

    return () => {
      isMounted = false;
    };
  }, [user, isLoaded, needsRefresh]);

  const refresh = () => {
    setNeedsRefresh(prev => !prev);
  };

  return {
    manufacturer,
    // Ensure that we do not report loading if the user isn’t loaded
    isLoading: !isLoaded || isLoading,
    error,
    refresh,
  };
}
