import type { UserRole } from './auth';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
