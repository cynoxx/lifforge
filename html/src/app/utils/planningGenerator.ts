import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ScheduledBlock } from '../types';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'cours' | 'repas' | 'sport' | 'autre';
  label: string;
}

interface FreeSlot {
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface WeeklyGoals {
  studyMinutesPerDay: number; // 180 (3h)
  workoutSessionsPerWeek: number; // 4
  runningSessionsPerWeek: number; // 1
  youtubeMinutesPerDay: number; // 30
}

const DEFAULT_GOALS: WeeklyGoals = {
  studyMinutesPerDay: 180,
  workoutSessionsPerWeek: 4,
  runningSessionsPerWeek: 1,
  youtubeMinutesPerDay: 30,
};

const DAYS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Convertir un nom de jour en index (0 = Lundi)
const getDayIndex = (dayName: string): number => {
  return DAYS_ORDER.indexOf(dayName);
};

// Convertir time string en minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convertir minutes en time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Trouver les créneaux libres dans une journée
const findFreeSlots = (
  day: string,
  date: string,
  fixedSlots: TimeSlot[],
  workDayStart: number = 7 * 60, // 7h00
  workDayEnd: number = 23 * 60 // 23h00
): FreeSlot[] => {
  const daySlots = fixedSlots
    .filter(s => s.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const freeSlots: FreeSlot[] = [];
  let currentTime = workDayStart;

  for (const slot of daySlots) {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    if (currentTime < slotStart) {
      const duration = slotStart - currentTime;
      if (duration >= 30) { // Au moins 30 minutes de libre
        freeSlots.push({
          day,
          date,
          startTime: minutesToTime(currentTime),
          endTime: minutesToTime(slotStart),
          durationMinutes: duration,
        });
      }
    }

    currentTime = Math.max(currentTime, slotEnd);
  }

  // Créneau après le dernier slot fixe
  if (currentTime < workDayEnd) {
    const duration = workDayEnd - currentTime;
    if (duration >= 30) {
      freeSlots.push({
        day,
        date,
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(workDayEnd),
        durationMinutes: duration,
      });
    }
  }

  return freeSlots;
};

// Générer le planning intelligent pour une semaine
export const generateWeeklyPlanning = (
  fixedSlots: TimeSlot[],
  goals: WeeklyGoals = DEFAULT_GOALS
): ScheduledBlock[] => {
  const blocks: ScheduledBlock[] = [];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lundi

  // Stats pour distribution
  let workoutsScheduled = 0;
  let runningScheduled = 0;
  const studyPerDay: { [key: string]: number } = {};

  // Parcourir chaque jour de la semaine
  DAYS_ORDER.forEach((dayName, dayIndex) => {
    const currentDate = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    const freeSlots = findFreeSlots(dayName, currentDate, fixedSlots);

    studyPerDay[currentDate] = 0;

    // Trier les créneaux par durée (les plus longs d'abord)
    const sortedSlots = [...freeSlots].sort((a, b) => b.durationMinutes - a.durationMinutes);

    for (const slot of sortedSlots) {
      let remainingTime = slot.durationMinutes;
      let currentStart = timeToMinutes(slot.startTime);

      // Prioriser les séances de muscu (4x/semaine)
      if (
        workoutsScheduled < goals.workoutSessionsPerWeek &&
        remainingTime >= 90 && // Au moins 1h30 pour muscu
        (dayIndex === 0 || dayIndex === 2 || dayIndex === 4 || dayIndex === 5) // Lun, Mer, Ven, Sam
      ) {
        blocks.push({
          id: `workout-${blocks.length}`,
          type: 'muscu',
          date: currentDate,
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + 90),
          completed: false,
          label: '💪 Séance Musculation',
        });
        currentStart += 90;
        remainingTime -= 90;
        workoutsScheduled++;
      }

      // Ajouter la course (1x/semaine, dimanche ou samedi)
      if (
        runningScheduled < goals.runningSessionsPerWeek &&
        remainingTime >= 45 &&
        (dayIndex === 5 || dayIndex === 6) // Samedi ou Dimanche
      ) {
        blocks.push({
          id: `run-${blocks.length}`,
          type: 'course',
          date: currentDate,
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + 45),
          completed: false,
          label: '🏃 Course à pied',
        });
        currentStart += 45;
        remainingTime -= 45;
        runningScheduled++;
      }

      // Remplir avec des sessions d'études (objectif 3h/jour)
      while (
        studyPerDay[currentDate] < goals.studyMinutesPerDay &&
        remainingTime >= 60 // Minimum 1h de session
      ) {
        const studyDuration = Math.min(120, remainingTime, goals.studyMinutesPerDay - studyPerDay[currentDate]); // Max 2h par session
        
        if (studyDuration >= 60) {
          blocks.push({
            id: `study-${blocks.length}`,
            type: 'etudes',
            date: currentDate,
            startTime: minutesToTime(currentStart),
            endTime: minutesToTime(currentStart + studyDuration),
            completed: false,
            label: '📚 Session Études',
          });
          currentStart += studyDuration;
          remainingTime -= studyDuration;
          studyPerDay[currentDate] += studyDuration;
        } else {
          break;
        }
      }

      // Ajouter YouTube si il reste du temps (30 min/jour)
      if (remainingTime >= 30) {
        const youtubeDuration = Math.min(30, remainingTime);
        blocks.push({
          id: `youtube-${blocks.length}`,
          type: 'youtube',
          date: currentDate,
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + youtubeDuration),
          completed: false,
          label: '🎬 YouTube / Création',
        });
        currentStart += youtubeDuration;
        remainingTime -= youtubeDuration;
      }
    }
  });

  return blocks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });
};

// Générer le planning pour aujourd'hui uniquement
export const generateDailyPlanning = (
  fixedSlots: TimeSlot[],
  currentDate: Date = new Date()
): ScheduledBlock[] => {
  const blocks: ScheduledBlock[] = [];
  const dayIndex = (currentDate.getDay() + 6) % 7; // Convertir dimanche=0 en lundi=0
  const dayName = DAYS_ORDER[dayIndex];
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const freeSlots = findFreeSlots(dayName, dateStr, fixedSlots);
  const sortedSlots = [...freeSlots].sort((a, b) => b.durationMinutes - a.durationMinutes);

  let studyToday = 0;
  let workoutAdded = false;

  for (const slot of sortedSlots) {
    let currentStart = timeToMinutes(slot.startTime);
    let remainingTime = slot.durationMinutes;

    // Muscu en priorité si créneau > 90 min et pas encore fait
    if (!workoutAdded && remainingTime >= 90 && dayIndex !== 6) { // Pas le dimanche
      blocks.push({
        id: `workout-${blocks.length}`,
        type: 'muscu',
        date: dateStr,
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(currentStart + 90),
        completed: false,
        label: '💪 Séance Musculation',
      });
      currentStart += 90;
      remainingTime -= 90;
      workoutAdded = true;
    }

    // Études : objectif 3h
    while (studyToday < 180 && remainingTime >= 60) {
      const studyDuration = Math.min(120, remainingTime, 180 - studyToday);
      if (studyDuration >= 60) {
        blocks.push({
          id: `study-${blocks.length}`,
          type: 'etudes',
          date: dateStr,
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + studyDuration),
          completed: false,
          label: '📚 Session Études',
        });
        currentStart += studyDuration;
        remainingTime -= studyDuration;
        studyToday += studyDuration;
      } else {
        break;
      }
    }

    // YouTube
    if (remainingTime >= 30) {
      blocks.push({
        id: `youtube-${blocks.length}`,
        type: 'youtube',
        date: dateStr,
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(currentStart + 30),
        completed: false,
        label: '🎬 YouTube / Création',
      });
    }
  }

  return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// Analyser le planning et donner des recommandations
export const analyzePlanning = (blocks: ScheduledBlock[]): {
  studyHours: number;
  workoutSessions: number;
  recommendations: string[];
} => {
  const studyMinutes = blocks
    .filter(b => b.type === 'etudes')
    .reduce((sum, b) => {
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      return sum + (end - start);
    }, 0);

  const workoutSessions = blocks.filter(b => b.type === 'muscu').length;

  const recommendations: string[] = [];

  if (studyMinutes < 180) {
    recommendations.push(`⚠️ Seulement ${Math.floor(studyMinutes / 60)}h d'études planifiées. Objectif: 3h/jour`);
  }

  if (workoutSessions < 4) {
    recommendations.push(`💪 ${workoutSessions} séances muscu/semaine. Objectif: 4 minimum`);
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Planning optimal ! Tous les objectifs sont respectés.');
  }

  return {
    studyHours: studyMinutes / 60,
    workoutSessions,
    recommendations,
  };
};
