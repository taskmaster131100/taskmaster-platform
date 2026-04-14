import React from 'react';
import { useSearchParams } from 'react-router-dom';
import RequestAccessForm from './RequestAccessForm';

// RegisterForm is loaded only when a valid invite param is present
const RegisterForm = React.lazy(() => import('./RegisterForm'));

export default function RegisterGate() {
  const [params] = useSearchParams();
  const hasInvite = params.has('invite') && params.get('invite') !== '';

  if (hasInvite) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <RegisterForm />
      </React.Suspense>
    );
  }

  return <RequestAccessForm />;
}
