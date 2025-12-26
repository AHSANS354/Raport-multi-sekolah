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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Calculator, Loader2, Eye, RefreshCw } from 'lucide-react';
import type {
  Student,
  Subject,
  Semester,
  SchoolClass,
  FinalGrade,
  FinalGradeFormData,
  ApiListResponse,
  ApiItemResponse,
} from '@/types/entities';

export default function FinalGradesPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  // Dialog state
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFinalGrade, setSelectedFinalGrade] = useState<FinalGrade | null>(null);
  const [sasScore, setSasScore] = useState<string>('');

  // Fetch classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ApiListResponse<SchoolClass>>('/classes'),
  });

  // Fetch subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<ApiListResponse<Subject>>('/subjects'),
  });

  // Fetch semesters
  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => apiClient.get<ApiListResponse<Semester>>('/semesters'),
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
  const canLoadData = Boolean(selectedClassId && selectedSubjectId && selectedSemesterId);

  // Fetch existing final grades
  const {
    data: finalGradesData,
    isLoading: isLoadingFinalGrades,
    refetch: refetchFinalGrades,
  } = useQuery({
    queryKey: ['final-grades', selectedSubjectId, selectedSemesterId],
    queryFn: () =>
      apiClient.get<ApiListResponse<FinalGrade>>('/final-grades', {
        subject_id: selectedSubjectId,
        semester_id: selectedSemesterId,
      }),
    enabled: canLoadData,
  });

  // Calculate final grade mutation
  const calculateMutation = useMutation({
    mutationFn: (data: FinalGradeFormData) =>
      apiClient.post<ApiItemResponse<FinalGrade>>('/final-grades/calculate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-grades'] });
      toast.success('Nilai akhir berhasil dihitung');
      handleCloseCalculateDialog();
    },
    onError: () => {
      toast.error('Gagal menghitung nilai akhir');
    },
  });

  // Get final grade for a student
  const getFinalGradeForStudent = (studentId: number): FinalGrade | undefined => {
    return finalGradesData?.data?.find((fg) => fg.student_id === studentId);
  };

  // Handle open calculate dialog
  const handleOpenCalculate = (student: Student) => {
    setSelectedStudent(student);
    const existingGrade = getFinalGradeForStudent(student.id);
    setSasScore(existingGrade?.sas_score?.toString() || '');
    setIsCalculateDialogOpen(true);
  };

  // Handle close calculate dialog
  const handleCloseCalculateDialog = () => {
    setIsCalculateDialogOpen(false);
    setSelectedStudent(null);
    setSasScore('');
  };

  // Handle view final grade
  const handleViewFinalGrade = (student: Student) => {
    const finalGrade = getFinalGradeForStudent(student.id);
    if (finalGrade) {
      setSelectedFinalGrade(finalGrade);
      setIsViewDialogOpen(true);
    }
  };

  // Handle calculate submit
  const handleCalculateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubjectId || !selectedSemesterId) return;

    const score = parseFloat(sasScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Nilai SAS harus antara 0-100');
      return;
    }

    calculateMutation.mutate({
      student_id: selectedStudent.id,
      subject_id: parseInt(selectedSubjectId),
      semester_id: parseInt(selectedSemesterId),
      sas_score: score,
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

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const semesters = semestersData?.data || [];
  const students = studentsData?.data || [];

  const isLoadingFilters = isLoadingClasses || isLoadingSubjects || isLoadingSemesters;

  // Get selected names for display
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id.toString() === selectedSubjectId),
    [subjects, selectedSubjectId]
  );
  const selectedSemester = useMemo(
    () => semesters.find((s) => s.id.toString() === selectedSemesterId),
    [semesters, selectedSemesterId]
  );
  const selectedClass = useMemo(
    () => classes.find((c) => c.id.toString() === selectedClassId),
    [classes, selectedClassId]
  );

  return (
    <DashboardLayout title="Nilai Akhir" requiredRoles={['admin', 'teacher']}>
      <div className="space-y-4">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Pilih kelas, mata pelajaran, dan semester untuk menghitung nilai akhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                  disabled={isLoadingFilters}
                >
                  <SelectTrigger id="subject">
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
                  {selectedClass?.name} - {selectedSubject?.name} - {selectedSemester?.academic_year?.name} {selectedSemester?.name}
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
                      <TableHead className="text-center">Rata-rata Formatif</TableHead>
                      <TableHead className="text-center">Nilai SAS</TableHead>
                      <TableHead className="text-center">Nilai Akhir</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const finalGrade = getFinalGradeForStudent(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.nisn}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-center">
                            {finalGrade ? Number(finalGrade.avg_formative).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {finalGrade ? Number(finalGrade.sas_score).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {finalGrade ? Number(finalGrade.final_score).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {finalGrade ? getGradeBadge(Number(finalGrade.final_score)) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCalculate(student)}
                              >
                                <Calculator className="mr-2 h-4 w-4" />
                                Hitung
                              </Button>
                              {finalGrade && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewFinalGrade(student)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat
                                </Button>
                              )}
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
                Pilih kelas, mata pelajaran, dan semester untuk menampilkan daftar siswa
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Calculate Dialog */}
      <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hitung Nilai Akhir</DialogTitle>
            <DialogDescription>
              Masukkan nilai SAS untuk {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCalculateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Siswa</Label>
                <Input value={selectedStudent?.name || ''} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Mata Pelajaran</Label>
                <Input value={selectedSubject?.name || ''} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Semester</Label>
                <Input
                  value={`${selectedSemester?.academic_year?.name || ''} - ${selectedSemester?.name || ''}`}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sas_score">Nilai SAS (Sumatif Akhir Semester)</Label>
                <Input
                  id="sas_score"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={sasScore}
                  onChange={(e) => setSasScore(e.target.value)}
                  placeholder="Masukkan nilai SAS (0-100)"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Nilai akhir akan dihitung dari rata-rata formatif dan nilai SAS
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCalculateDialog}
              >
                Batal
              </Button>
              <Button type="submit" disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghitung...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Hitung Nilai
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Final Grade Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Nilai Akhir</DialogTitle>
            <DialogDescription>
              {selectedFinalGrade?.student?.name} - {selectedFinalGrade?.subject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Rata-rata Formatif</Label>
                <p className="text-2xl font-bold">
                  {selectedFinalGrade ? Number(selectedFinalGrade.avg_formative).toFixed(2) : '-'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nilai SAS</Label>
                <p className="text-2xl font-bold">
                  {selectedFinalGrade ? Number(selectedFinalGrade.sas_score).toFixed(2) : '-'}
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Nilai Akhir</Label>
                  <p className="text-3xl font-bold">
                    {selectedFinalGrade ? Number(selectedFinalGrade.final_score).toFixed(2) : '-'}
                  </p>
                </div>
                <div>
                  {selectedFinalGrade && getGradeBadge(Number(selectedFinalGrade.final_score))}
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <Label className="text-muted-foreground">Deskripsi</Label>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedFinalGrade?.description || 'Tidak ada deskripsi'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
