// School entity
export interface School {
  id: number;
  name: string;
  npsn: string;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolFormData {
  name: string;
  npsn: string;
  address?: string;
  logo_url?: string;
}

// Academic Year entity
export interface AcademicYear {
  id: number;
  school_id: number;
  name: string;
  is_active: boolean;
  semesters?: Semester[];
  created_at: string;
  updated_at: string;
}

export interface AcademicYearFormData {
  name: string;
  is_active?: boolean;
}

// Semester entity
export interface Semester {
  id: number;
  academic_year_id: number;
  name: 'Ganjil' | 'Genap';
  is_active: boolean;
  academic_year?: AcademicYear;
  created_at: string;
  updated_at: string;
}

export interface SemesterFormData {
  academic_year_id: number;
  name: 'Ganjil' | 'Genap';
  is_active?: boolean;
}

// Class entity
export interface SchoolClass {
  id: number;
  school_id: number;
  name: string;
  level: number;
  students?: Student[];
  created_at: string;
  updated_at: string;
}

export interface SchoolClassFormData {
  name: string;
  level: number;
}

// Student entity
export interface Student {
  id: number;
  school_id: number;
  class_id: number;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  school_class?: SchoolClass;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  class_id: number;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
}

// Subject entity
export interface Subject {
  id: number;
  school_id: number;
  name: string;
  learning_goals?: LearningGoal[];
  created_at: string;
  updated_at: string;
}

export interface SubjectFormData {
  name: string;
}

// Learning Goal entity
export interface LearningGoal {
  id: number;
  subject_id: number;
  semester_id: number;
  class_level: number;
  code: string;
  description: string;
  subject?: Subject;
  semester?: Semester;
  created_at: string;
  updated_at: string;
}

export interface LearningGoalFormData {
  subject_id: number;
  semester_id: number;
  class_level: number;
  code: string;
  description: string;
}

// Score entity
export interface Score {
  id: number;
  student_id: number;
  learning_goal_id: number;
  score: number;
  student?: Student;
  learning_goal?: LearningGoal;
  created_at: string;
  updated_at: string;
}

export interface ScoreFormData {
  student_id: number;
  learning_goal_id: number;
  score: number;
}

export interface BulkScoreFormData {
  scores: ScoreFormData[];
}

// Score Grid types
export interface ScoreGridStudent {
  student_id: number;
  nisn: string;
  name: string;
  scores: Record<number, number | null>;
}

export interface ScoreGridData {
  students: ScoreGridStudent[];
  learning_goals: LearningGoal[];
}

export interface ScoreGridResponse {
  data: ScoreGridData;
  message: string;
}

// Final Grade entity
export interface FinalGrade {
  id: number;
  student_id: number;
  subject_id: number;
  semester_id: number;
  avg_formative: number;
  sas_score: number;
  final_score: number;
  description: string;
  student?: Student;
  subject?: Subject;
  semester?: Semester;
  created_at: string;
  updated_at: string;
}

export interface FinalGradeFormData {
  student_id: number;
  subject_id: number;
  semester_id: number;
  sas_score: number;
  description?: string;
}

// API Response types
export interface ApiListResponse<T> {
  data: T[];
  message: string;
}

export interface ApiItemResponse<T> {
  data: T;
  message: string;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  message: string;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// Teacher entity (for assignment)
export interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  school_id: number;
  assigned_classes?: SchoolClass[];
}

// Class Teacher Assignment entity
export interface ClassTeacher {
  id: number;
  user_id: number;
  class_id: number;
  user?: Teacher;
  school_class?: SchoolClass;
  created_at: string;
  updated_at: string;
}

export interface ClassTeacherFormData {
  user_id: number;
  class_id: number;
}
