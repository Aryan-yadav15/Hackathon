'use client';

import { useSearchParams } from 'next/navigation';

export default function RegistrationSuccess() {
    const searchParams = useSearchParams();
    const authStatus = searchParams.get('authStatus');
    
    return (
        <div className="text-center text-green-600 p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Authentication Successful</h1>
            <p className="mb-4">Your Google account has been successfully connected.</p>
            {authStatus && (
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <p className="text-sm">Auth Status: <span className="font-medium">{authStatus}</span></p>
                </div>
            )}
            <p className="text-sm text-gray-600 mt-8">You can now close this window and return to the main application.</p>
        </div>
    );
} 