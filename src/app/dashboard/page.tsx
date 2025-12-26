'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Users, BookOpen, Target, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Siswa',
      value: '-',
      description: 'Siswa terdaftar',
      icon: Users,
    },
    {
      title: 'Mata Pelajaran',
      value: '-',
      description: 'Mata pelajaran aktif',
      icon: BookOpen,
    },
    {
      title: 'Tujuan Pembelajaran',
      value: '-',
      description: 'TP semester ini',
      icon: Target,
    },
    {
      title: 'Rapor Terbit',
      value: '-',
      description: 'Rapor diterbitkan',
      icon: FileText,
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Selamat datang, {user?.name}!
          </h2>
          <p className="text-muted-foreground">
            {user?.school?.name || 'Sistem Rapor Kurikulum Merdeka'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>
                Aktivitas penilaian terbaru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Belum ada aktivitas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengumuman</CardTitle>
              <CardDescription>
                Informasi penting dari sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Belum ada pengumuman
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
