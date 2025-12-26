'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';

interface UseAuthGuardOptions {
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { requiredRoles, redirectTo = '/login' } = options;
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, redirectTo, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasAccess: isAuthenticated && (!requiredRoles || (user && requiredRoles.includes(user.role))),
  };
}
