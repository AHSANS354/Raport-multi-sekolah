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
import type { 
  LearningGoal, 
  LearningGoalFormData, 
  Subject, 
  Semester,
  ApiListResponse, 
  ApiItemResponse 
} from '@/types/entities';

export default function LearningGoalsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<LearningGoal | null>(null);
  
  // Filters
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterSemesterId, setFilterSemesterId] = useState<string>('all');
  const [filterClassLevel, setFilterClassLevel] = useState<string>('all');
  
  const [formData, setFormData] = useState<LearningGoalFormData>({
    subject_id: 0,
    semester_id: 0,
    class_level: 1,
    code: '',
    description: '',
  });

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['learning-goals', filterSubjectId, filterSemesterId, filterClassLevel],
    queryFn: () => {
      const params: Record<string, string | number> = {};
      if (filterSubjectId && filterSubjectId !== 'all') params.subject_id = filterSubjectId;
      if (filterSemesterId && filterSemesterId !== 'all') params.semester_id = filterSemesterId;
      if (filterClassLevel && filterClassLevel !== 'all') params.class_level = filterClassLevel;
      return apiClient.get<ApiListResponse<LearningGoal>>('/learning-goals', params);
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<ApiListResponse<Subject>>('/subjects'),
  });

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => apiClient.get<ApiListResponse<Semester>>('/semesters'),
  });

  const createMutation = useMutation({
    mutationFn: (data: LearningGoalFormData) =>
      apiClient.post<ApiItemResponse<LearningGoal>>('/learning-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      toast.success('Tujuan pembelajaran berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal menambahkan tujuan pembelajaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LearningGoalFormData }) =>
      apiClient.put<ApiItemResponse<LearningGoal>>(`/learning-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      toast.success('Tujuan pembelajaran berhasil diperbarui');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Gagal memperbarui tujuan pembelajaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/learning-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      toast.success('Tujuan pembelajaran berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingGoal(null);
    },
    onError: () => {
      toast.error('Gagal menghapus tujuan pembelajaran');
    },
  });

  const handleOpenCreate = () => {
    setEditingGoal(null);
    const firstSubject = subjectsData?.data?.[0];
    const firstSemester = semestersData?.data?.[0];
    setFormData({
      subject_id: firstSubject?.id || 0,
      semester_id: firstSemester?.id || 0,
      class_level: 1,
      code: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (goal: LearningGoal) => {
    setEditingGoal(goal);
    setFormData({
      subject_id: goal.subject_id,
      semester_id: goal.semester_id,
      class_level: goal.class_level,
      code: goal.code,
      description: goal.description,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (goal: LearningGoal) => {
    setDeletingGoal(goal);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingGoal) {
      deleteMutation.mutate(deletingGoal.id);
    }
  };

  const goals = goalsData?.data || [];
  const subjects = subjectsData?.data || [];
  const semesters = semestersData?.data || [];
  const canCreate = subjects.length > 0 && semesters.length > 0;

  return (
    <DashboardLayout title="Tujuan Pembelajaran" requiredRoles={['admin', 'teacher']}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Tujuan Pembelajaran</CardTitle>
            <CardDescription>Kelola tujuan pembelajaran (TP) per mata pelajaran</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} disabled={!canCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah TP
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <Select
              value={filterSubjectId}
              onValueChange={setFilterSubjectId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterSemesterId}
              onValueChange={setFilterSemesterId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.academic_year?.name} - {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterClassLevel}
              onValueChange={setFilterClassLevel}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Kelas {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada data tujuan pembelajaran
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.code}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={goal.description}>
                      {goal.description}
                    </TableCell>
                    <TableCell>{goal.subject?.name || '-'}</TableCell>
                    <TableCell>
                      {goal.semester?.academic_year?.name} - {goal.semester?.name}
                    </TableCell>
                    <TableCell>Kelas {goal.class_level}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(goal)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(goal)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? 'Perbarui informasi tujuan pembelajaran'
                : 'Masukkan informasi tujuan pembelajaran baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subject_id">Mata Pelajaran</Label>
                <Select
                  value={formData.subject_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semester_id">Semester</Label>
                <Select
                  value={formData.semester_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semester_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.academic_year?.name} - {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class_level">Tingkat Kelas</Label>
                <Select
                  value={formData.class_level.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_level: parseInt(value) })
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
              <div className="grid gap-2">
                <Label htmlFor="code">Kode TP</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Contoh: TP.1, TP.2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: TP.1, TP.2, TP.10, dst.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Masukkan deskripsi tujuan pembelajaran"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <DialogTitle>Hapus Tujuan Pembelajaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tujuan pembelajaran &quot;{deletingGoal?.code}&quot;?
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
