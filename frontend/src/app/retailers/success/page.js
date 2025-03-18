'use client'

import { Button } from "@/components/ui/button"

export default function RetailerSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Registration Successful!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your registration has been submitted successfully. The manufacturer will review your application and contact you soon.
        </p>
        <div className="mt-5">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
} 