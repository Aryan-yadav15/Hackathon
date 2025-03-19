'use client';

import { useSearchParams } from 'next/navigation';

export default function RegistrationError() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const status = searchParams.get('status');
    
    return (
        <div className="text-center text-red-600 p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Authentication Failed</h1>
            <p className="mb-4">There was an error connecting your Google account.</p>
            
            {(reason || status) && (
                <div className="bg-red-50 p-4 rounded-lg mb-4 text-left">
                    <h2 className="font-medium mb-2">Error Details:</h2>
                    {reason && <p className="text-sm mb-1">Reason: <span className="font-medium">{reason}</span></p>}
                    {status && <p className="text-sm">Status Code: <span className="font-medium">{status}</span></p>}
                </div>
            )}
            
            <p className="text-sm text-gray-600 mt-8">Please try again or contact support if the issue persists.</p>
        </div>
    );
} 