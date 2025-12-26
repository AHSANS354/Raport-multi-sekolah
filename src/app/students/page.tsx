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
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { 
  Student, 
  StudentFormData, 
  SchoolClass, 
  ApiListResponse, 
  ApiItemResponse,
  ApiPaginatedResponse 
} from '@/types/entities';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [formData, setFormData] = useState<StudentFormData>({
    class_id: 0,
    nisn: '',
    name: '',
    gender: 'L',
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', currentPage, searchQuery, filterClassId],
    queryFn: () => {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 10,
      };
      if (searchQuery) params.search = searchQuery;
      if (filterClassId && filterClassId !== 'all') params.class_id = filterClassId;
      return apiClient.get<ApiPaginatedResponse<Student>>('/students', params);
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ApiListResponse<SchoolClass>>('/classes'),
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentFormData) =>
      apiClient.post<ApiItemResponse<Student>>('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Siswa berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan siswa');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StudentFormData }) =>
      apiClient.put<ApiItemResponse<Student>>(`/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Siswa berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui siswa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Siswa berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingStudent(null);
    },
    onError: () => {
      toast.error('Gagal menghapus siswa');
    },
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    const firstClass = classesData?.data?.[0];
    setFormData({
      class_id: firstClass?.id || 0,
      nisn: '',
      name: '',
      gender: 'L',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      class_id: student.class_id,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (student: Student) => {
    setDeletingStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingStudent) {
      deleteMutation.mutate(deletingStudent.id);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const students = studentsData?.data || [];
  const classes = classesData?.data || [];
  const meta = studentsData?.meta;

  return (
    <DashboardLayout title="Siswa" requiredRoles={['admin', 'teacher']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>Kelola data siswa dalam sekolah</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} disabled={classes.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Siswa
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex-1">
              <Input
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Select
              value={filterClassId}
              onValueChange={(value) => {
                setFilterClassId(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data siswa
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NISN</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.nisn}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.school_class?.name || '-'}</TableCell>
                      <TableCell>
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenDelete(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {students.length} dari {meta.total} siswa
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Halaman {meta.current_page} dari {meta.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={currentPage === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? 'Perbarui informasi siswa'
                : 'Masukkan informasi siswa baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nisn">NISN</Label>
                <Input
                  id="nisn"
                  value={formData.nisn}
                  onChange={(e) =>
                    setFormData({ ...formData, nisn: e.target.value })
                  }
                  placeholder="Masukkan NISN"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class_id">Kelas</Label>
                <Select
                  value={formData.class_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'L' | 'P') =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
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
            <DialogTitle>Hapus Siswa</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus siswa &quot;{deletingStudent?.name}&quot;?
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
