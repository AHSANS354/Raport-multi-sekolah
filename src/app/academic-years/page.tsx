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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import type { AcademicYear, AcademicYearFormData, ApiListResponse, ApiItemResponse } from '@/types/entities';

export default function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [deletingYear, setDeletingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<AcademicYearFormData>({
    name: '',
    is_active: false,
  });

  const { data: yearsData, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiClient.get<ApiListResponse<AcademicYear>>('/academic-years'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AcademicYearFormData) =>
      apiClient.post<ApiItemResponse<AcademicYear>>('/academic-years', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Tahun ajaran berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan tahun ajaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AcademicYearFormData }) =>
      apiClient.put<ApiItemResponse<AcademicYear>>(`/academic-years/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Tahun ajaran berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui tahun ajaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/academic-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Tahun ajaran berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingYear(null);
    },
    onError: () => {
      toast.error('Gagal menghapus tahun ajaran');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.post<ApiItemResponse<AcademicYear>>(`/academic-years/${id}/set-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Tahun ajaran berhasil diaktifkan');
    },
    onError: () => {
      toast.error('Gagal mengaktifkan tahun ajaran');
    },
  });

  const handleOpenCreate = () => {
    setEditingYear(null);
    setFormData({ name: '', is_active: false });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      is_active: year.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (year: AcademicYear) => {
    setDeletingYear(year);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingYear(null);
    setFormData({ name: '', is_active: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingYear) {
      updateMutation.mutate({ id: editingYear.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingYear) {
      deleteMutation.mutate(deletingYear.id);
    }
  };

  const handleSetActive = (year: AcademicYear) => {
    if (!year.is_active) {
      setActiveMutation.mutate(year.id);
    }
  };

  const years = yearsData?.data || [];

  return (
    <DashboardLayout title="Tahun Ajaran" requiredRoles={['admin']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Tahun Ajaran</CardTitle>
            <CardDescription>Kelola tahun ajaran sekolah</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tahun Ajaran
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : years.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data tahun ajaran
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Jumlah Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>{year.semesters?.length || 0}</TableCell>
                    <TableCell>
                      {year.is_active ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!year.is_active && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSetActive(year)}
                            title="Aktifkan"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(year)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(year)}
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
              {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? 'Perbarui informasi tahun ajaran'
                : 'Masukkan informasi tahun ajaran baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Tahun Ajaran</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: 2024/2025"
                  required
                />
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
            <DialogTitle>Hapus Tahun Ajaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tahun ajaran &quot;{deletingYear?.name}&quot;?
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
