import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Plus, Trash2, Clock, Sparkles } from 'lucide-react';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'cours' | 'repas' | 'sport' | 'autre';
  label: string;
}

interface ScheduleSetupProps {
  onComplete: (schedule: TimeSlot[]) => void;
  onSkip: () => void;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const ScheduleSetup = ({ onComplete, onSkip }: ScheduleSetupProps) => {
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [slots, setSlots] = useState<TimeSlot[]>([
    // Repas par défaut
    { id: '1', day: 'Lundi', startTime: '12:00', endTime: '13:00', type: 'repas', label: 'Déjeuner' },
    { id: '2', day: 'Lundi', startTime: '19:00', endTime: '20:00', type: 'repas', label: 'Dîner' },
  ]);
  const [newSlot, setNewSlot] = useState({
    startTime: '08:00',
    endTime: '10:00',
    type: 'cours' as const,
    label: '',
  });

  const addSlot = () => {
    if (!newSlot.label || !newSlot.startTime || !newSlot.endTime) return;

    const slot: TimeSlot = {
      id: Date.now().toString(),
      day: selectedDay,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      type: newSlot.type,
      label: newSlot.label,
    };

    setSlots([...slots, slot]);
    setNewSlot({
      startTime: '08:00',
      endTime: '10:00',
      type: 'cours',
      label: '',
    });
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const getSlotsForDay = (day: string) => {
    return slots
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const duplicateToAllDays = () => {
    const mondaySlots = slots.filter(s => s.day === 'Lundi');
    const newSlots: TimeSlot[] = [];
    
    DAYS.forEach(day => {
      if (day === 'Lundi') return;
      mondaySlots.forEach(slot => {
        newSlots.push({
          ...slot,
          id: `${slot.id}-${day}-${Date.now()}`,
          day,
        });
      });
    });

    setSlots([...slots, ...newSlots]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cours': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'repas': return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'sport': return 'bg-green-500/20 border-green-500 text-green-400';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'cours': return '📖';
      case 'repas': return '🍽️';
      case 'sport': return '⚽';
      default: return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#00ff00]/20 p-4 rounded-full mb-4">
            <Calendar className="w-12 h-12 text-[#00ff00]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">CONFIGURE TON PLANNING</h1>
          <p className="text-gray-400">
            Indique tes cours, repas et activités fixes.<br />
            L'IA remplira automatiquement les créneaux libres avec des sessions productives !
          </p>
        </div>

        {/* Sélection du jour */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Jour de la semaine</label>
          <div className="grid grid-cols-4 gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-lg border-2 font-black transition-all ${
                  selectedDay === day
                    ? 'bg-[#00ff00]/20 border-[#00ff00] text-[#00ff00]'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Ajouter un créneau */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#00ff00]" />
            Ajouter un créneau pour {selectedDay}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Heure début</label>
              <Input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Heure fin</label>
              <Input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Type</label>
            <Select value={newSlot.type} onValueChange={(v) => setNewSlot({ ...newSlot, type: v as any })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cours">📖 Cours</SelectItem>
                <SelectItem value="repas">🍽️ Repas</SelectItem>
                <SelectItem value="sport">⚽ Sport / Activité</SelectItem>
                <SelectItem value="autre">📌 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <Input
              type="text"
              placeholder="Ex: Cours de maths, Déjeuner, Entraînement foot..."
              value={newSlot.label}
              onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={addSlot}
            className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter ce créneau
          </Button>
        </div>

        {/* Créneaux du jour sélectionné */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <h3 className="font-black text-white mb-4">
            Planning du {selectedDay} ({getSlotsForDay(selectedDay).length} créneaux)
          </h3>

          {getSlotsForDay(selectedDay).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun créneau configuré pour ce jour
            </div>
          ) : (
            <div className="space-y-2">
              {getSlotsForDay(selectedDay).map(slot => (
                <div
                  key={slot.id}
                  className={`border rounded-lg p-4 flex items-center justify-between ${getTypeColor(slot.type)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeEmoji(slot.type)}</span>
                    <div>
                      <div className="font-black">{slot.label}</div>
                      <div className="text-sm opacity-75">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-black text-blue-400 mb-1">⚡ Action rapide</div>
              <div className="text-sm text-gray-300">
                Dupliquer le planning du Lundi sur toute la semaine
              </div>
            </div>
            <Button
              onClick={duplicateToAllDays}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
            >
              Dupliquer
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-white">{slots.length}</div>
            <div className="text-xs text-gray-400">Créneaux fixés</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-[#00ff00]">
              {Math.floor(slots.reduce((sum, s) => {
                const [startH, startM] = s.startTime.split(':').map(Number);
                const [endH, endM] = s.endTime.split(':').map(Number);
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                return sum + duration;
              }, 0) / 60)}h
            </div>
            <div className="text-xs text-gray-400">Temps occupé</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-blue-400">
              {16 - Math.floor(slots.reduce((sum, s) => {
                const [startH, startM] = s.startTime.split(':').map(Number);
                const [endH, endM] = s.endTime.split(':').map(Number);
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                return sum + duration;
              }, 0) / 60)}h
            </div>
            <div className="text-xs text-gray-400">Temps libre (moy)</div>
          </div>
        </div>

        {/* Validation */}
        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-400"
          >
            Passer cette étape
          </Button>
          <Button
            onClick={() => onComplete(slots)}
            className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Générer mon planning intelligent
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          L'IA remplira automatiquement les créneaux libres avec études, muscu, course et YouTube
        </div>
      </div>
    </div>
  );
};
