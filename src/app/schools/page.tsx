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
import type { School, SchoolFormData, ApiListResponse, ApiItemResponse } from '@/types/entities';

export default function SchoolsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    npsn: '',
    address: '',
    logo_url: '',
  });

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => apiClient.get<ApiListResponse<School>>('/schools'),
  });

  const createMutation = useMutation({
    mutationFn: (data: SchoolFormData) =>
      apiClient.post<ApiItemResponse<School>>('/schools', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('Sekolah berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan sekolah');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SchoolFormData }) =>
      apiClient.put<ApiItemResponse<School>>(`/schools/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('Sekolah berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui sekolah');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('Sekolah berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingSchool(null);
    },
    onError: () => {
      toast.error('Gagal menghapus sekolah');
    },
  });

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setFormData({ name: '', npsn: '', address: '', logo_url: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      npsn: school.npsn,
      address: school.address || '',
      logo_url: school.logo_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (school: School) => {
    setDeletingSchool(school);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
    setFormData({ name: '', npsn: '', address: '', logo_url: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingSchool) {
      deleteMutation.mutate(deletingSchool.id);
    }
  };

  const schools = schoolsData?.data || [];

  return (
    <DashboardLayout title="Manajemen Sekolah" requiredRoles={['admin']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Sekolah</CardTitle>
            <CardDescription>Kelola data sekolah dalam sistem</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Sekolah
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : schools.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data sekolah
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>NPSN</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.npsn}</TableCell>
                    <TableCell>{school.address || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(school)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(school)}
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
              {editingSchool ? 'Edit Sekolah' : 'Tambah Sekolah'}
            </DialogTitle>
            <DialogDescription>
              {editingSchool
                ? 'Perbarui informasi sekolah'
                : 'Masukkan informasi sekolah baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Sekolah</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama sekolah"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="npsn">NPSN</Label>
                <Input
                  id="npsn"
                  value={formData.npsn}
                  onChange={(e) =>
                    setFormData({ ...formData, npsn: e.target.value })
                  }
                  placeholder="Masukkan NPSN"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Masukkan alamat sekolah"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">URL Logo</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_url: e.target.value })
                  }
                  placeholder="Masukkan URL logo"
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
            <DialogTitle>Hapus Sekolah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus sekolah &quot;{deletingSchool?.name}&quot;?
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
