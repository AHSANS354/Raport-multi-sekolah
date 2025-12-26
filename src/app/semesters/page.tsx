'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import type { 
  Semester, 
  SemesterFormData, 
  AcademicYear, 
  ApiListResponse, 
  ApiItemResponse 
} from '@/types/entities';

export default function SemestersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState<SemesterFormData>({
    academic_year_id: 0,
    name: 'Ganjil',
    is_active: false,
  });

  const { data: semestersData, isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => apiClient.get<ApiListResponse<Semester>>('/semesters'),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiClient.get<ApiListResponse<AcademicYear>>('/academic-years'),
  });

  const createMutation = useMutation({
    mutationFn: (data: SemesterFormData) =>
      apiClient.post<ApiItemResponse<Semester>>('/semesters', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Semester berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan semester');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SemesterFormData> }) =>
      apiClient.put<ApiItemResponse<Semester>>(`/semesters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Semester berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui semester');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/semesters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Semester berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingSemester(null);
    },
    onError: () => {
      toast.error('Gagal menghapus semester');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.post<ApiItemResponse<Semester>>(`/semesters/${id}/set-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast.success('Semester berhasil diaktifkan');
    },
    onError: () => {
      toast.error('Gagal mengaktifkan semester');
    },
  });

  const handleOpenCreate = () => {
    setEditingSemester(null);
    const firstYear = academicYearsData?.data?.[0];
    setFormData({
      academic_year_id: firstYear?.id || 0,
      name: 'Ganjil',
      is_active: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      academic_year_id: semester.academic_year_id,
      name: semester.name,
      is_active: semester.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (semester: Semester) => {
    setDeletingSemester(semester);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSemester(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSemester) {
      updateMutation.mutate({ 
        id: editingSemester.id, 
        data: { name: formData.name } 
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingSemester) {
      deleteMutation.mutate(deletingSemester.id);
    }
  };

  const handleSetActive = (semester: Semester) => {
    if (!semester.is_active) {
      setActiveMutation.mutate(semester.id);
    }
  };

  const semesters = semestersData?.data || [];
  const academicYears = academicYearsData?.data || [];

  return (
    <DashboardLayout title="Semester" requiredRoles={['admin']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Semester</CardTitle>
            <CardDescription>Kelola semester dalam tahun ajaran</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} disabled={academicYears.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Semester
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : semesters.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data semester
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell>{semester.academic_year?.name || '-'}</TableCell>
                    <TableCell className="font-medium">{semester.name}</TableCell>
                    <TableCell>
                      {semester.is_active ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!semester.is_active && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSetActive(semester)}
                            title="Aktifkan"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(semester)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(semester)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSemester ? 'Edit Semester' : 'Tambah Semester'}
            </DialogTitle>
            <DialogDescription>
              {editingSemester
                ? 'Perbarui informasi semester'
                : 'Masukkan informasi semester baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!editingSemester && (
                <div className="grid gap-2">
                  <Label htmlFor="academic_year_id">Tahun Ajaran</Label>
                  <Select
                    value={formData.academic_year_id.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, academic_year_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Semester</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value: 'Ganjil' | 'Genap') =>
                    setFormData({ ...formData, name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                    <SelectItem value="Genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Semester</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus semester &quot;{deletingSemester?.name}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
