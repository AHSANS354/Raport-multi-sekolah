'use client';

import { useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScoreCell } from './score-cell';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { LearningGoal, ScoreGridStudent } from '@/types/entities';

interface ScoreGridProps {
  students: ScoreGridStudent[];
  learningGoals: LearningGoal[];
  onScoreChange: (studentId: number, learningGoalId: number, score: number | null) => void;
  pendingChanges: Map<string, number | null>;
  isLoading?: boolean;
}

export function ScoreGrid({
  students,
  learningGoals,
  onScoreChange,
  pendingChanges,
  isLoading = false,
}: ScoreGridProps) {
  const getScoreKey = useCallback((studentId: number, learningGoalId: number) => {
    return `${studentId}-${learningGoalId}`;
  }, []);

  const getDisplayScore = useCallback(
    (studentId: number, learningGoalId: number, originalScore: number | null) => {
      const key = getScoreKey(studentId, learningGoalId);
      if (pendingChanges.has(key)) {
        return pendingChanges.get(key) ?? null;
      }
      return originalScore;
    },
    [pendingChanges, getScoreKey]
  );

  const columns = useMemo<ColumnDef<ScoreGridStudent>[]>(() => {
    const staticColumns: ColumnDef<ScoreGridStudent>[] = [
      {
        accessorKey: 'nisn',
        header: 'NISN',
        cell: (info) => (
          <div className="font-mono text-sm whitespace-nowrap">{info.getValue() as string}</div>
        ),
        size: 100,
      },
      {
        accessorKey: 'name',
        header: 'Nama Siswa',
        cell: (info) => (
          <div className="font-medium whitespace-nowrap min-w-[150px]">
            {info.getValue() as string}
          </div>
        ),
        size: 200,
      },
    ];

    const scoreColumns: ColumnDef<ScoreGridStudent>[] = learningGoals.map((goal) => ({
      id: `score_${goal.id}`,
      accessorFn: (row: ScoreGridStudent) => row.scores[goal.id],
      header: () => (
        <div className="text-center" title={goal.description}>
          <div className="font-medium">{goal.code}</div>
        </div>
      ),
      cell: (info) => {
        const studentId = info.row.original.student_id;
        const originalScore = info.row.original.scores[goal.id] ?? null;
        const displayScore = getDisplayScore(studentId, goal.id, originalScore);
        
        return (
          <ScoreCell
            value={displayScore}
            studentId={studentId}
            learningGoalId={goal.id}
            onScoreChange={onScoreChange}
            isLoading={isLoading}
          />
        );
      },
      size: 80,
    }));

    return [...staticColumns, ...scoreColumns];
  }, [learningGoals, onScoreChange, isLoading, getDisplayScore]);

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada siswa dalam kelas ini
      </div>
    );
  }

  if (learningGoals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada tujuan pembelajaran untuk mata pelajaran dan semester ini
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="bg-muted/50"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
