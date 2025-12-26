'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScoreGrid } from '@/components/score-grid';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import type {
  SchoolClass,
  Subject,
  Semester,
  ApiListResponse,
  ScoreGridResponse,
  ScoreFormData,
} from '@/types/entities';

interface BulkScoreResponse {
  data: unknown[];
  message: string;
  count: number;
}

export default function ScoresPage() {
  const queryClient = useQueryClient();
  
  // Filter state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  
  // Track pending changes (not yet saved to server)
  const [pendingChanges, setPendingChanges] = useState<Map<string, number | null>>(new Map());

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

  // Check if all filters are selected
  const canLoadGrid = Boolean(selectedClassId && selectedSubjectId && selectedSemesterId);

  // Fetch score grid data
  const {
    data: gridData,
    isLoading: isLoadingGrid,
    refetch: refetchGrid,
  } = useQuery({
    queryKey: ['score-grid', selectedClassId, selectedSubjectId, selectedSemesterId],
    queryFn: () =>
      apiClient.get<ScoreGridResponse>('/scores/grid', {
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        semester_id: selectedSemesterId,
      }),
    enabled: canLoadGrid,
  });

  // Bulk save mutation
  const bulkSaveMutation = useMutation({
    mutationFn: (scores: ScoreFormData[]) =>
      apiClient.post<BulkScoreResponse>('/scores/bulk', { scores }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['score-grid', selectedClassId, selectedSubjectId, selectedSemesterId],
      });
      setPendingChanges(new Map());
      toast.success(`${response.count} nilai berhasil disimpan`);
    },
    onError: () => {
      toast.error('Gagal menyimpan nilai');
    },
  });

  // Handle score change
  const handleScoreChange = useCallback(
    (studentId: number, learningGoalId: number, score: number | null) => {
      const key = `${studentId}-${learningGoalId}`;
      setPendingChanges((prev) => {
        const newMap = new Map(prev);
        
        // Get original score from grid data
        const originalScore = gridData?.data?.students
          ?.find((s) => s.student_id === studentId)
          ?.scores[learningGoalId] ?? null;
        
        // If the new score equals the original, remove from pending changes
        if (score === originalScore) {
          newMap.delete(key);
        } else {
          newMap.set(key, score);
        }
        
        return newMap;
      });
    },
    [gridData]
  );

  // Handle bulk save
  const handleSave = useCallback(() => {
    if (pendingChanges.size === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }

    const scores: ScoreFormData[] = [];
    pendingChanges.forEach((score, key) => {
      if (score !== null) {
        const [studentId, learningGoalId] = key.split('-').map(Number);
        scores.push({
          student_id: studentId,
          learning_goal_id: learningGoalId,
          score,
        });
      }
    });

    if (scores.length === 0) {
      toast.info('Tidak ada nilai valid untuk disimpan');
      return;
    }

    bulkSaveMutation.mutate(scores);
  }, [pendingChanges, bulkSaveMutation]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (pendingChanges.size > 0) {
      const confirmed = window.confirm(
        'Ada perubahan yang belum disimpan. Yakin ingin memuat ulang data?'
      );
      if (!confirmed) return;
    }
    setPendingChanges(new Map());
    refetchGrid();
  }, [pendingChanges, refetchGrid]);

  // Get selected class level for display
  const selectedClass = useMemo(() => {
    return classesData?.data?.find((c) => c.id.toString() === selectedClassId);
  }, [classesData, selectedClassId]);

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const semesters = semestersData?.data || [];
  const students = gridData?.data?.students || [];
  const learningGoals = gridData?.data?.learning_goals || [];

  const isLoadingFilters = isLoadingClasses || isLoadingSubjects || isLoadingSemesters;
  const hasUnsavedChanges = pendingChanges.size > 0;

  return (
    <DashboardLayout title="Input Nilai" requiredRoles={['admin', 'teacher']}>
      <div className="space-y-4">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Pilih kelas, mata pelajaran, dan semester untuk menampilkan grid nilai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={(value) => {
                    setSelectedClassId(value);
                    setPendingChanges(new Map());
                  }}
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
                  onValueChange={(value) => {
                    setSelectedSubjectId(value);
                    setPendingChanges(new Map());
                  }}
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
                  onValueChange={(value) => {
                    setSelectedSemesterId(value);
                    setPendingChanges(new Map());
                  }}
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

        {/* Score Grid Card */}
        {canLoadGrid && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Grid Nilai</CardTitle>
                <CardDescription>
                  {selectedClass?.name} - {subjects.find((s) => s.id.toString() === selectedSubjectId)?.name}
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-orange-500">
                      ({pendingChanges.size} perubahan belum disimpan)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingGrid}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingGrid ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || bulkSaveMutation.isPending}
                >
                  {bulkSaveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Simpan Nilai
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingGrid ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Memuat data...</span>
                </div>
              ) : (
                <ScoreGrid
                  students={students}
                  learningGoals={learningGoals}
                  onScoreChange={handleScoreChange}
                  pendingChanges={pendingChanges}
                  isLoading={bulkSaveMutation.isPending}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state when no filters selected */}
        {!canLoadGrid && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Pilih kelas, mata pelajaran, dan semester untuk menampilkan grid nilai
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
