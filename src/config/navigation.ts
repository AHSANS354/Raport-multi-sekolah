import {
  LayoutDashboard,
  School,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  Target,
  ClipboardList,
  FileText,
  Settings,
} from 'lucide-react';
import type { NavGroup } from '@/types/navigation';

export const navigationConfig: NavGroup[] = [
  {
    title: 'Menu Utama',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Manajemen Sekolah',
    items: [
      {
        title: 'Sekolah',
        href: '/schools',
        icon: School,
        roles: ['admin'],
      },
      {
        title: 'Tahun Ajaran',
        href: '/academic-years',
        icon: Calendar,
        roles: ['admin'],
      },
      {
        title: 'Semester',
        href: '/semesters',
        icon: Calendar,
        roles: ['admin'],
      },
      {
        title: 'Kelas',
        href: '/classes',
        icon: Users,
        roles: ['admin'],
      },
      {
        title: 'Siswa',
        href: '/students',
        icon: Users,
        roles: ['admin'],
      },
      {
        title: 'Penugasan Guru',
        href: '/teacher-assignments',
        icon: UserCheck,
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Kurikulum',
    items: [
      {
        title: 'Mata Pelajaran',
        href: '/subjects',
        icon: BookOpen,
        roles: ['admin', 'teacher'],
      },
      {
        title: 'Tujuan Pembelajaran',
        href: '/learning-goals',
        icon: Target,
        roles: ['admin', 'teacher'],
      },
    ],
  },
  {
    title: 'Penilaian',
    items: [
      {
        title: 'Input Nilai',
        href: '/scores',
        icon: ClipboardList,
        roles: ['teacher'],
      },
      {
        title: 'Nilai Akhir',
        href: '/final-grades',
        icon: FileText,
        roles: ['teacher'],
      },
      {
        title: 'Rapor',
        href: '/reports',
        icon: FileText,
        roles: ['teacher', 'parent'],
      },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      {
        title: 'Pengaturan',
        href: '/settings',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];
