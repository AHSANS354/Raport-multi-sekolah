'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import type {
  Student,
  Subject,
  Semester,
  SchoolClass,
  FinalGrade,
  ApiListResponse,
  ApiItemResponse,
} from '@/types/entities';

function PrintReportContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');
  const semesterId = searchParams.get('semester_id');

  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch student data
  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => apiClient.get<ApiItemResponse<Student>>(`/students/${studentId}`),
    enabled: Boolean(studentId),
  });

  // Fetch semester data
  const { data: semesterData, isLoading: isLoadingSemester } = useQuery({
    queryKey: ['semester', semesterId],
    queryFn: () => apiClient.get<ApiItemResponse<Semester>>(`/semesters/${semesterId}`),
    enabled: Boolean(semesterId),
  });

  // Fetch class data
  const { data: classData, isLoading: isLoadingClass } = useQuery({
    queryKey: ['class', studentData?.data?.class_id],
    queryFn: () =>
      apiClient.get<ApiItemResponse<SchoolClass>>(`/classes/${studentData?.data?.class_id}`),
    enabled: Boolean(studentData?.data?.class_id),
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<ApiListResponse<Subject>>('/subjects'),
  });

  // Fetch final grades
  const { data: finalGradesData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['final-grades-print', studentId, semesterId],
    queryFn: () =>
      apiClient.get<ApiListResponse<FinalGrade>>('/final-grades', {
        student_id: studentId,
        semester_id: semesterId,
      }),
    enabled: Boolean(studentId && semesterId),
  });

  const student = studentData?.data;
  const semester = semesterData?.data;
  const schoolClass = classData?.data;
  const subjects = subjectsData?.data || [];
  const finalGrades = finalGradesData?.data || [];

  const isLoading = isLoadingStudent || isLoadingSemester || isLoadingClass || isLoadingGrades;

  // Get subject name by ID
  const getSubjectName = (subjectId: number): string => {
    return subjects.find((s) => s.id === subjectId)?.name || '-';
  };

  // Get grade letter
  const getGradeLetter = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  };

  // Auto print when data is loaded
  useEffect(() => {
    if (!isLoading && student && semester && finalGrades.length > 0 && !isPrinting) {
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isLoading, student, semester, finalGrades, isPrinting]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Memuat data rapor...</span>
      </div>
    );
  }

  if (!student || !semester) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="print-container p-8 max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Laporan Hasil Belajar Peserta Didik</h1>
        <h2 className="text-lg font-semibold mt-1">Kurikulum Merdeka</h2>
        <p className="text-sm mt-2">
          Tahun Pelajaran {semester.academic_year?.name} - Semester {semester.name}
        </p>
      </div>

      {/* Student Info */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex">
            <span className="w-32 font-medium">Nama Siswa</span>
            <span className="mr-2">:</span>
            <span className="font-semibold">{student.name}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">NISN</span>
            <span className="mr-2">:</span>
            <span>{student.nisn}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="w-32 font-medium">Kelas</span>
            <span className="mr-2">:</span>
            <span>{schoolClass?.name || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">Semester</span>
            <span className="mr-2">:</span>
            <span>{semester.name}</span>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b pb-2">A. Nilai Akademik</h3>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-3 py-2 text-left">No</th>
              <th className="border border-black px-3 py-2 text-left">Mata Pelajaran</th>
              <th className="border border-black px-3 py-2 text-center">Nilai Formatif</th>
              <th className="border border-black px-3 py-2 text-center">Nilai SAS</th>
              <th className="border border-black px-3 py-2 text-center">Nilai Akhir</th>
              <th className="border border-black px-3 py-2 text-center">Predikat</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((grade, index) => (
              <tr key={grade.id}>
                <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                <td className="border border-black px-3 py-2">{getSubjectName(grade.subject_id)}</td>
                <td className="border border-black px-3 py-2 text-center">
                  {Number(grade.avg_formative).toFixed(0)}
                </td>
                <td className="border border-black px-3 py-2 text-center">
                  {Number(grade.sas_score).toFixed(0)}
                </td>
                <td className="border border-black px-3 py-2 text-center font-semibold">
                  {Number(grade.final_score).toFixed(0)}
                </td>
                <td className="border border-black px-3 py-2 text-center font-bold">
                  {getGradeLetter(Number(grade.final_score))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Descriptions */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b pb-2">B. Deskripsi Capaian Kompetensi</h3>
        <div className="space-y-4">
          {finalGrades.map((grade, index) => (
            <div key={grade.id} className="border border-gray-300 p-3 rounded">
              <h4 className="font-semibold mb-2">
                {index + 1}. {getSubjectName(grade.subject_id)}
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {grade.description || 'Tidak ada deskripsi'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="mb-16">Orang Tua/Wali</p>
          <p className="border-t border-black pt-1 inline-block px-8">
            (.................................)
          </p>
        </div>
        <div className="text-center">
          <p className="mb-2">
            .................., ............................
          </p>
          <p className="mb-14">Wali Kelas</p>
          <p className="border-t border-black pt-1 inline-block px-8">
            (.................................)
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            padding: 0;
            max-width: none;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
        @media screen {
          .print-container {
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
          }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Memuat...</span>
    </div>
  );
}

export default function PrintReportPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PrintReportContent />
    </Suspense>
  );
}
