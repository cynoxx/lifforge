export interface UserProfile {
  name: string;
  age: number;
  currentAverage: number;
  targetAverage: number;
  startDate: string;
  photo?: string;
  bio?: string;
  grades?: Grade[];
}

export interface Grade {
  id: string;
  subject: string;
  grade: number;
  coefficient: number;
  date: string;
  label?: string;
}

export interface TimeSlot {
  id: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Lundi, 6 = Dimanche
  startTime: string; // "HH:mm"
  endTime: string;
  type: 'fixed' | 'available';
  category: 'cours' | 'trajet' | 'repas' | 'famille' | 'etudes' | 'muscu' | 'course' | 'youtube' | 'libre';
  label?: string;
}

export interface DailySchedule {
  wakeTime: string;
  bedTime: string;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  [key: number]: DailySchedule; // 0-6 for Mon-Sun
}

export interface ScheduledBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: 'etudes' | 'muscu' | 'course' | 'youtube' | 'lecture' | 'football';
  completed: boolean;
  label?: string;
  checkInPhoto?: string;
  missedReason?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  type: 'pec-tris' | 'jambes' | 'dos-bis' | 'epaules';
  exercises: Exercise[];
  completed: boolean;
  duration?: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface StudySession {
  id: string;
  date: string;
  subject: string;
  duration: number; // minutes
  completed: boolean;
  pomodorosCompleted: number;
}

export interface AppState {
  onboardingComplete: boolean;
  userProfile?: UserProfile;
  weeklySchedule?: WeeklySchedule;
  scheduledBlocks: ScheduledBlock[];
  fixedScheduleSlots?: FixedScheduleSlot[];
  streak: number;
  missedSessions: number;
  weight?: number;
  progressPhotos: { date: string; url: string }[];
  studySessions: StudySession[];
  workoutSessions: WorkoutSession[];
}

export interface FixedScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'cours' | 'repas' | 'sport' | 'autre';
  label: string;
}