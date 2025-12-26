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
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Subject, SubjectFormData, ApiListResponse, ApiItemResponse } from '@/types/entities';

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
  });

  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<ApiListResponse<Subject>>('/subjects'),
  });

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) =>
      apiClient.post<ApiItemResponse<Subject>>('/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Mata pelajaran berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan mata pelajaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubjectFormData }) =>
      apiClient.put<ApiItemResponse<Subject>>(`/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Mata pelajaran berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui mata pelajaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Mata pelajaran berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingSubject(null);
    },
    onError: () => {
      toast.error('Gagal menghapus mata pelajaran');
    },
  });

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (subject: Subject) => {
    setDeletingSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setFormData({ name: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingSubject) {
      deleteMutation.mutate(deletingSubject.id);
    }
  };

  const subjects = subjectsData?.data || [];

  return (
    <DashboardLayout title="Mata Pelajaran" requiredRoles={['admin', 'teacher']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Mata Pelajaran</CardTitle>
            <CardDescription>Kelola mata pelajaran dalam sekolah</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mata Pelajaran
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data mata pelajaran
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Mata Pelajaran</TableHead>
                  <TableHead>Jumlah Tujuan Pembelajaran</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.learning_goals?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(subject)}
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
              {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Perbarui informasi mata pelajaran'
                : 'Masukkan informasi mata pelajaran baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Mata Pelajaran</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Matematika, IPAS, Bahasa Indonesia"
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
            <DialogTitle>Hapus Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus mata pelajaran &quot;{deletingSubject?.name}&quot;?
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
