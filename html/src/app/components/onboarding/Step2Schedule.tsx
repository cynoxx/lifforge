import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { WeeklySchedule, DailySchedule, TimeSlot } from '../../types';

interface Step2ScheduleProps {
  onNext: (schedule: WeeklySchedule) => void;
  onBack: () => void;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const CATEGORIES = [
  { value: 'cours', label: '📚 Cours', type: 'fixed' },
  { value: 'trajet', label: '🚗 Trajet', type: 'fixed' },
  { value: 'repas', label: '🍽️ Repas', type: 'fixed' },
  { value: 'famille', label: '👨‍👩‍👧 Famille', type: 'fixed' },
  { value: 'etudes', label: '📖 Études (dispo)', type: 'available' },
  { value: 'muscu', label: '💪 Muscu (dispo)', type: 'available' },
  { value: 'course', label: '🏃 Course (dispo)', type: 'available' },
  { value: 'youtube', label: '🎬 YouTube (dispo)', type: 'available' },
  { value: 'libre', label: '⚡ Temps libre', type: 'available' },
] as const;

export const Step2Schedule = ({ onNext, onBack }: Step2ScheduleProps) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    0: { wakeTime: '06:00', bedTime: '22:00', slots: [] },
    1: { wakeTime: '06:00', bedTime: '22:00', slots: [] },
    2: { wakeTime: '06:00', bedTime: '22:00', slots: [] },
    3: { wakeTime: '06:00', bedTime: '22:00', slots: [] },
    4: { wakeTime: '06:00', bedTime: '22:00', slots: [] },
    5: { wakeTime: '07:00', bedTime: '23:00', slots: [] },
    6: { wakeTime: '07:00', bedTime: '23:00', slots: [] },
  });

  const currentDaySchedule = schedule[currentDay];

  const addSlot = () => {
    const newSlot: TimeSlot = {
      id: `${currentDay}-${Date.now()}`,
      day: currentDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: '08:00',
      endTime: '09:00',
      type: 'fixed',
      category: 'cours',
      label: '',
    };

    setSchedule({
      ...schedule,
      [currentDay]: {
        ...currentDaySchedule,
        slots: [...currentDaySchedule.slots, newSlot],
      },
    });
  };

  const updateSlot = (slotId: string, updates: Partial<TimeSlot>) => {
    setSchedule({
      ...schedule,
      [currentDay]: {
        ...currentDaySchedule,
        slots: currentDaySchedule.slots.map(slot =>
          slot.id === slotId ? { ...slot, ...updates } : slot
        ),
      },
    });
  };

  const removeSlot = (slotId: string) => {
    setSchedule({
      ...schedule,
      [currentDay]: {
        ...currentDaySchedule,
        slots: currentDaySchedule.slots.filter(slot => slot.id !== slotId),
      },
    });
  };

  const updateDayTimes = (wakeTime?: string, bedTime?: string) => {
    setSchedule({
      ...schedule,
      [currentDay]: {
        ...currentDaySchedule,
        wakeTime: wakeTime || currentDaySchedule.wakeTime,
        bedTime: bedTime || currentDaySchedule.bedTime,
      },
    });
  };

  const copyToAllDays = () => {
    const newSchedule = { ...schedule };
    for (let i = 0; i < 7; i++) {
      if (i !== currentDay) {
        newSchedule[i] = {
          ...currentDaySchedule,
          slots: currentDaySchedule.slots.map(slot => ({
            ...slot,
            id: `${i}-${Date.now()}-${Math.random()}`,
            day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          })),
        };
      }
    }
    setSchedule(newSchedule);
  };

  const handleNext = () => {
    onNext(schedule);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#00ff00] mb-2">
            PLANNING PERSONNALISÉ
          </h1>
          <p className="text-gray-400">
            Configure ton emploi du temps. L'IA remplira automatiquement tes créneaux disponibles.
          </p>
        </div>

        {/* Day selector */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {DAYS.map((day, index) => (
              <button
                key={index}
                onClick={() => setCurrentDay(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  currentDay === index
                    ? 'bg-[#00ff00] text-black font-black'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Wake/Bed times */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00ff00]" />
                Réveil
              </Label>
              <Input
                type="time"
                value={currentDaySchedule.wakeTime}
                onChange={(e) => updateDayTimes(e.target.value, undefined)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00ff00]" />
                Coucher
              </Label>
              <Input
                type="time"
                value={currentDaySchedule.bedTime}
                onChange={(e) => updateDayTimes(undefined, e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Slots */}
        <div className="space-y-4 mb-6">
          {currentDaySchedule.slots.map((slot) => {
            const category = CATEGORIES.find(c => c.value === slot.category);
            return (
              <div key={slot.id} className="bg-gray-900 rounded-lg p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-4">
                    <Label className="text-gray-400 text-xs mb-1 block">Type</Label>
                    <Select
                      value={slot.category}
                      onValueChange={(value: any) => {
                        const cat = CATEGORIES.find(c => c.value === value);
                        updateSlot(slot.id, { 
                          category: value,
                          type: cat?.type as 'fixed' | 'available'
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-gray-400 text-xs mb-1 block">Début</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-gray-400 text-xs mb-1 block">Fin</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSlot(slot.id)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={addSlot}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un créneau
          </Button>
          <Button
            onClick={copyToAllDays}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            Copier à tous les jours
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
          >
            Retour
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
          >
            Valider le planning
          </Button>
        </div>
      </div>
    </div>
  );
};
