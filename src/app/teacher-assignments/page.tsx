'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';
import type {
  Teacher,
  SchoolClass,
  ClassTeacher,
  ApiListResponse,
} from '@/types/entities';

export default function TeacherAssignmentsPage() {
  const { isLoading: authLoading } = useAuthGuard({ requiredRoles: ['admin'] });
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch teachers
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiClient.get<ApiListResponse<Teacher>>('/teachers'),
  });

  // Fetch classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ApiListResponse<SchoolClass>>('/classes'),
  });

  // Fetch assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => apiClient.get<ApiListResponse<ClassTeacher>>('/teacher-assignments'),
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: { user_id: number; class_id: number }) =>
      apiClient.post('/teacher-assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Guru berhasil ditugaskan ke kelas');
      setIsDialogOpen(false);
      setSelectedTeacher('');
      setSelectedClass('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menugaskan guru');
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/teacher-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Penugasan berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus penugasan');
    },
  });

  const handleSubmit = () => {
    if (!selectedTeacher || !selectedClass) {
      toast.error('Pilih guru dan kelas');
      return;
    }
    createMutation.mutate({
      user_id: parseInt(selectedTeacher),
      class_id: parseInt(selectedClass),
    });
  };

  if (authLoading || teachersLoading || classesLoading || assignmentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Memuat...</p>
        </div>
      </DashboardLayout>
    );
  }

  const teachers = teachersData?.data || [];
  const classes = classesData?.data || [];
  const assignments = assignmentsData?.data || [];

  // Group assignments by teacher
  const assignmentsByTeacher = teachers.map((teacher) => ({
    teacher,
    assignments: assignments.filter((a) => a.user_id === teacher.id),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Penugasan Guru</h1>
            <p className="text-muted-foreground">
              Kelola penugasan guru ke kelas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Penugasan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Penugasan Guru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guru</label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih guru" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kelas</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} (Tingkat {cls.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Guru dan Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Kelas yang Ditugaskan</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsByTeacher.map(({ teacher, assignments }) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {assignments.length === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            Belum ada kelas
                          </span>
                        ) : (
                          assignments.map((assignment) => (
                            <Badge
                              key={assignment.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {assignment.school_class?.name || `Kelas ${assignment.class_id}`}
                              <button
                                onClick={() => deleteMutation.mutate(assignment.id)}
                                className="ml-1 hover:text-destructive"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {assignments.length} kelas
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {teachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Belum ada guru terdaftar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
