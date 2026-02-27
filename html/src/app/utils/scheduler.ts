import { WeeklySchedule, ScheduledBlock, TimeSlot } from '../types';
import { addDays, format, parse, isBefore, isAfter } from 'date-fns';

// Génère les blocs automatiquement pour la semaine
export const generateWeeklyBlocks = (
  weeklySchedule: WeeklySchedule,
  startDate: Date
): ScheduledBlock[] => {
  const blocks: ScheduledBlock[] = [];
  
  // Pour chaque jour de la semaine
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dayOfWeek = currentDate.getDay();
    // Convertir dimanche (0) en 6, et décaler les autres
    const scheduleDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const dailySchedule = weeklySchedule[scheduleDay];
    if (!dailySchedule) continue;
    
    // Trouver les créneaux disponibles pour chaque type d'activité
    const availableSlots = dailySchedule.slots.filter(slot => slot.type === 'available');
    
    // Planifier études (priorité haute)
    const studySlots = availableSlots.filter(slot => 
      slot.category === 'etudes' || slot.category === 'libre'
    );
    
    // Essayer de planifier 2-3 sessions d'étude de 45min
    let studyTimeAllocated = 0;
    const targetStudyTime = 180; // 3h par jour
    
    for (const slot of studySlots) {
      if (studyTimeAllocated >= targetStudyTime) break;
      
      const slotDuration = getSlotDuration(slot.startTime, slot.endTime);
      if (slotDuration >= 45) {
        blocks.push({
          id: `study-${format(currentDate, 'yyyy-MM-dd')}-${slot.id}`,
          date: format(currentDate, 'yyyy-MM-dd'),
          startTime: slot.startTime,
          endTime: addMinutesToTime(slot.startTime, Math.min(45, slotDuration)),
          type: 'etudes',
          completed: false,
        });
        studyTimeAllocated += 45;
      }
    }
    
    // Planifier muscu (4x par semaine : mar, jeu, sam, dim)
    const muscuSlots = availableSlots.filter(slot => slot.category === 'muscu');
    if ([1, 3, 5, 6].includes(scheduleDay) && muscuSlots.length > 0) {
      const slot = muscuSlots[0];
      const muscuTypes = ['pec-tris', 'dos-bis', 'jambes', 'epaules'];
      const typeIndex = [1, 3, 5, 6].indexOf(scheduleDay);
      
      blocks.push({
        id: `muscu-${format(currentDate, 'yyyy-MM-dd')}`,
        date: format(currentDate, 'yyyy-MM-dd'),
        startTime: slot.startTime,
        endTime: addMinutesToTime(slot.startTime, 60),
        type: 'muscu',
        completed: false,
      });
    }
    
    // Planifier course (1x par semaine, samedi)
    const runSlots = availableSlots.filter(slot => slot.category === 'course');
    if (scheduleDay === 5 && runSlots.length > 0) {
      const slot = runSlots[0];
      blocks.push({
        id: `course-${format(currentDate, 'yyyy-MM-dd')}`,
        date: format(currentDate, 'yyyy-MM-dd'),
        startTime: slot.startTime,
        endTime: addMinutesToTime(slot.startTime, 40),
        type: 'course',
        completed: false,
      });
    }
    
    // Planifier YouTube (bonus quotidien 30min)
    const ytSlots = availableSlots.filter(slot => slot.category === 'youtube');
    if (ytSlots.length > 0) {
      const slot = ytSlots[0];
      blocks.push({
        id: `youtube-${format(currentDate, 'yyyy-MM-dd')}`,
        date: format(currentDate, 'yyyy-MM-dd'),
        startTime: slot.startTime,
        endTime: addMinutesToTime(slot.startTime, 30),
        type: 'youtube',
        completed: false,
      });
    }
  }
  
  return blocks;
};

const getSlotDuration = (startTime: string, endTime: string): number => {
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());
  return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const date = parse(time, 'HH:mm', new Date());
  const newDate = new Date(date.getTime() + minutes * 60 * 1000);
  return format(newDate, 'HH:mm');
};

// Calculer la projection de moyenne basée sur les sessions d'études
export const calculateAverageProjection = (
  currentAverage: number,
  targetAverage: number,
  studySessionsCompleted: number,
  daysElapsed: number
): number => {
  // Algo simplifié: chaque session augmente progressivement vers la cible
  const targetSessions = 180; // 6 mois de sessions
  const progress = studySessionsCompleted / targetSessions;
  const projectedGain = (targetAverage - currentAverage) * progress;
  return Math.min(currentAverage + projectedGain, targetAverage);
};

// Calculer les jours restants vers l'objectif
export const getDaysToGoal = (startDate: string): number => {
  const start = new Date(startDate);
  const target = addDays(start, 180); // 6 mois
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};
