"use client";

import { useState } from 'react';
import { BasiqService } from '@/lib/basiq/service';
import type { BasiqConfig } from '@/lib/basiq/types';

const basiqConfig: BasiqConfig = {
  apiKey: process.env.NEXT_PUBLIC_BASIQ_API_KEY || '',
  applicationId: process.env.NEXT_PUBLIC_BASIQ_APPLICATION_ID || '',
  environment: 'sandbox' as const,
};

const banks = [
  { id: 'AU00001', name: 'NAB', logo: '/nab-logo.png', bgColor: 'bg-red-600' },
  { id: 'AU00002', name: 'Westpac', logo: '/westpac-logo.png', bgColor: 'bg-red-700' },
  { id: 'AU00003', name: 'CommBank', logo: '/commbank-logo.png', bgColor: 'bg-yellow-500' },
  { id: 'AU00004', name: 'ANZ', logo: '/anz-logo.png', bgColor: 'bg-blue-600' },
];

export default function OnboardPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+61421567009');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'bank'>('email');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep('bank');
    }
  };

  const handleBankSelect = async (bankId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/basiq/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          bankId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to bank');
      }

      if (data.authLink) {
        // Store the user ID in session storage for later use
        sessionStorage.setItem('userId', data.userId);
        // Redirect to the auth link
        window.location.href = data.authLink;
      } else {
        throw new Error('No auth link received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to bank');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connect your bank account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Select your bank
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleBankSelect(bank.id)}
                disabled={loading}
                className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-12 h-12 ${bank.bgColor} rounded-full mb-2`}></div>
                <span className="text-sm font-medium text-gray-900">{bank.name}</span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Connecting to bank...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
