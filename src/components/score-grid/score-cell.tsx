'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ScoreCellProps {
  value: number | null;
  studentId: number;
  learningGoalId: number;
  onScoreChange: (studentId: number, learningGoalId: number, score: number | null) => void;
  isLoading?: boolean;
}

export function ScoreCell({
  value,
  studentId,
  learningGoalId,
  onScoreChange,
  isLoading = false,
}: ScoreCellProps) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleFocus = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    validateAndSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndSubmit();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(value?.toString() ?? '');
      setHasError(false);
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      validateAndSubmit();
    }
  };

  const validateAndSubmit = () => {
    const trimmed = localValue.trim();
    
    if (trimmed === '') {
      setHasError(false);
      if (value !== null) {
        onScoreChange(studentId, learningGoalId, null);
      }
      return;
    }

    const numValue = parseInt(trimmed, 10);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setHasError(true);
      return;
    }

    setHasError(false);
    if (numValue !== value) {
      onScoreChange(studentId, learningGoalId, numValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow numbers
    if (newValue === '' || /^\d*$/.test(newValue)) {
      setLocalValue(newValue);
      setHasError(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      className={cn(
        'h-8 w-16 text-center px-1',
        hasError && 'border-red-500 focus-visible:ring-red-500',
        isEditing && 'ring-2 ring-primary',
        isLoading && 'opacity-50'
      )}
      placeholder="-"
    />
  );
}
