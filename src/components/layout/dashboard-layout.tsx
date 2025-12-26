'use client';

import { type ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Header } from './header';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/types/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  requiredRoles?: UserRole[];
}

export function DashboardLayout({
  children,
  title,
  requiredRoles,
}: DashboardLayoutProps) {
  const { isLoading, hasAccess } = useAuthGuard({ requiredRoles });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title={title} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
