'use client';

import { useState, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Eye, Pencil, Loader2, RefreshCw, FileText, Printer } from 'lucide-react';
import type {
  Student,
  Subject,
  Semester,
  SchoolClass,
  FinalGrade,
  ApiListResponse,
  ApiItemResponse,
} from '@/types/entities';

export default function ReportsPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  // Dialog state
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [editingFinalGradeId, setEditingFinalGradeId] = useState<number | null>(null);

  // Fetch classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ApiListResponse<SchoolClass>>('/classes'),
  });

  // Fetch semesters
  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => apiClient.get<ApiListResponse<Semester>>('/semesters'),
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<ApiListResponse<Subject>>('/subjects'),
  });

  // Fetch students by class
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-by-class', selectedClassId],
    queryFn: () =>
      apiClient.get<ApiListResponse<Student>>('/students', {
        class_id: selectedClassId,
        per_page: 100,
      }),
    enabled: Boolean(selectedClassId),
  });

  // Check if all filters are selected
  const canLoadData = Boolean(selectedClassId && selectedSemesterId);

  // Fetch all final grades for the semester
  const {
    data: finalGradesData,
    isLoading: isLoadingFinalGrades,
    refetch: refetchFinalGrades,
  } = useQuery({
    queryKey: ['final-grades-semester', selectedSemesterId],
    queryFn: () =>
      apiClient.get<ApiListResponse<FinalGrade>>('/final-grades', {
        semester_id: selectedSemesterId,
      }),
    enabled: canLoadData,
  });

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: ({ id, description }: { id: number; description: string }) =>
      apiClient.put<ApiItemResponse<FinalGrade>>(`/final-grades/${id}/description`, {
        description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-grades-semester'] });
      toast.success('Deskripsi berhasil diperbarui');
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal memperbarui deskripsi');
    },
  });

  // Get final grades for a student
  const getFinalGradesForStudent = (studentId: number): FinalGrade[] => {
    return finalGradesData?.data?.filter((fg) => fg.student_id === studentId) || [];
  };

  // Handle print report
  const handlePrintReport = (student: Student) => {
    const printUrl = `/reports/print?student_id=${student.id}&semester_id=${selectedSemesterId}`;
    window.open(printUrl, '_blank');
  };

  // Handle preview report
  const handlePreviewReport = (student: Student) => {
    setSelectedStudent(student);
    setIsPreviewDialogOpen(true);
  };

  // Handle edit description
  const handleEditDescription = (finalGrade: FinalGrade) => {
    setEditingFinalGradeId(finalGrade.id);
    setEditingDescription(finalGrade.description || '');
    setIsEditDialogOpen(true);
  };

  // Handle save description
  const handleSaveDescription = () => {
    if (editingFinalGradeId === null) return;
    updateDescriptionMutation.mutate({
      id: editingFinalGradeId,
      description: editingDescription,
    });
  };

  // Get grade badge color
  const getGradeBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">A</Badge>;
    if (score >= 80) return <Badge className="bg-blue-500">B</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">C</Badge>;
    if (score >= 60) return <Badge className="bg-orange-500">D</Badge>;
    return <Badge className="bg-red-500">E</Badge>;
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: number): string => {
    return subjectsData?.data?.find((s) => s.id === subjectId)?.name || '-';
  };

  const classes = classesData?.data || [];
  const semesters = semestersData?.data || [];
  const students = studentsData?.data || [];

  const isLoadingFilters = isLoadingClasses || isLoadingSemesters;

  // Get selected names for display
  const selectedSemester = useMemo(
    () => semesters.find((s) => s.id.toString() === selectedSemesterId),
    [semesters, selectedSemesterId]
  );
  const selectedClass = useMemo(
    () => classes.find((c) => c.id.toString() === selectedClassId),
    [classes, selectedClassId]
  );

  // Get student's final grades for preview
  const studentFinalGrades = selectedStudent
    ? getFinalGradesForStudent(selectedStudent.id)
    : [];

  return (
    <DashboardLayout title="Rapor" requiredRoles={['admin', 'teacher', 'parent']}>
      <div className="space-y-4">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Pilih kelas dan semester untuk melihat rapor siswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                  disabled={isLoadingFilters}
                >
                  <SelectTrigger id="class">
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

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={selectedSemesterId}
                  onValueChange={setSelectedSemesterId}
                  disabled={isLoadingFilters}
                >
                  <SelectTrigger id="semester">
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
            </div>
          </CardContent>
        </Card>

        {/* Students List Card */}
        {canLoadData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Siswa</CardTitle>
                <CardDescription>
                  {selectedClass?.name} - {selectedSemester?.academic_year?.name} {selectedSemester?.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchFinalGrades()}
                disabled={isLoadingFinalGrades}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingFinalGrades ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingStudents || isLoadingFinalGrades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Memuat data...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada siswa di kelas ini
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead className="text-center">Jumlah Mata Pelajaran</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const gradesCount = getFinalGradesForStudent(student.id).length;
                      const hasGrades = gradesCount > 0;
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.nisn}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-center">{gradesCount}</TableCell>
                          <TableCell className="text-center">
                            {hasGrades ? (
                              <Badge variant="default">Tersedia</Badge>
                            ) : (
                              <Badge variant="secondary">Belum Ada</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreviewReport(student)}
                                disabled={!hasGrades}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintReport(student)}
                                disabled={!hasGrades}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state when no filters selected */}
        {!canLoadData && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Pilih kelas dan semester untuk menampilkan daftar siswa
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapor Siswa
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.name} - {selectedClass?.name} - {selectedSemester?.academic_year?.name} {selectedSemester?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Nama Siswa</Label>
                <p className="font-semibold">{selectedStudent?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">NISN</Label>
                <p className="font-semibold">{selectedStudent?.nisn}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Kelas</Label>
                <p className="font-semibold">{selectedClass?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Semester</Label>
                <p className="font-semibold">
                  {selectedSemester?.academic_year?.name} - {selectedSemester?.name}
                </p>
              </div>
            </div>

            <Separator />

            {/* Grades Table */}
            <div>
              <h3 className="font-semibold mb-3">Nilai Per Mata Pelajaran</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead className="text-center">Rata-rata Formatif</TableHead>
                    <TableHead className="text-center">Nilai SAS</TableHead>
                    <TableHead className="text-center">Nilai Akhir</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFinalGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {getSubjectName(grade.subject_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(grade.avg_formative).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(grade.sas_score).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {Number(grade.final_score).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getGradeBadge(Number(grade.final_score))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Descriptions */}
            <div>
              <h3 className="font-semibold mb-3">Deskripsi Capaian Pembelajaran</h3>
              <div className="space-y-4">
                {studentFinalGrades.map((grade) => (
                  <div key={grade.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{getSubjectName(grade.subject_id)}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDescription(grade)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {grade.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => selectedStudent && handlePrintReport(selectedStudent)}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Description Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deskripsi</DialogTitle>
            <DialogDescription>
              Ubah deskripsi capaian pembelajaran siswa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Masukkan deskripsi capaian pembelajaran..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveDescription}
              disabled={updateDescriptionMutation.isPending}
            >
              {updateDescriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
