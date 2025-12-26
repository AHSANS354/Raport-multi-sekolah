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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { SchoolClass, SchoolClassFormData, ApiListResponse, ApiItemResponse } from '@/types/entities';

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState<SchoolClassFormData>({
    name: '',
    level: 1,
  });

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ApiListResponse<SchoolClass>>('/classes'),
  });

  const createMutation = useMutation({
    mutationFn: (data: SchoolClassFormData) =>
      apiClient.post<ApiItemResponse<SchoolClass>>('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Kelas berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan kelas');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SchoolClassFormData }) =>
      apiClient.put<ApiItemResponse<SchoolClass>>(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Kelas berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui kelas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Kelas berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingClass(null);
    },
    onError: () => {
      toast.error('Gagal menghapus kelas');
    },
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({ name: '', level: 1 });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass);
    setFormData({
      name: schoolClass.name,
      level: schoolClass.level,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (schoolClass: SchoolClass) => {
    setDeletingClass(schoolClass);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setFormData({ name: '', level: 1 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingClass) {
      deleteMutation.mutate(deletingClass.id);
    }
  };

  const classes = classesData?.data || [];

  return (
    <DashboardLayout title="Kelas" requiredRoles={['admin', 'teacher']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Kelas</CardTitle>
            <CardDescription>Kelola kelas dalam sekolah</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kelas
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data kelas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Jumlah Siswa</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((schoolClass) => (
                  <TableRow key={schoolClass.id}>
                    <TableCell className="font-medium">{schoolClass.name}</TableCell>
                    <TableCell>Kelas {schoolClass.level}</TableCell>
                    <TableCell>{schoolClass.students?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(schoolClass)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(schoolClass)}
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
              {editingClass ? 'Edit Kelas' : 'Tambah Kelas'}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? 'Perbarui informasi kelas'
                : 'Masukkan informasi kelas baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Kelas</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: 5A, 6B"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Tingkat</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Kelas {level}
                      </SelectItem>
                    ))}
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
            <DialogTitle>Hapus Kelas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelas &quot;{deletingClass?.name}&quot;?
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
