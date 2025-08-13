import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@/components/Auth';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Login() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">QR Event Manager</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your events and guests</p>
        </div>
        <Auth />
      </div>
    </div>
  );
}