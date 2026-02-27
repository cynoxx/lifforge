import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dumbbell, CheckCircle2, Circle, Plus, TrendingUp, Timer, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: number;
  completed: boolean;
}

interface WorkoutProgram {
  [key: string]: {
    name: string;
    emoji: string;
    exercises: Omit<Exercise, 'completed' | 'weight'>[];
  };
}

const WORKOUT_PROGRAMS: WorkoutProgram = {
  'pec-tris': {
    name: 'Pectoraux & Triceps',
    emoji: '💪',
    exercises: [
      { name: 'Développé couché', sets: 4, reps: '8-10' },
      { name: 'Développé incliné haltères', sets: 4, reps: '10-12' },
      { name: 'Écartés poulie haute', sets: 3, reps: '12-15' },
      { name: 'Dips', sets: 3, reps: '8-12' },
      { name: 'Extension triceps poulie', sets: 3, reps: '12-15' },
      { name: 'Barre au front', sets: 3, reps: '10-12' },
    ],
  },
  'dos-bis': {
    name: 'Dos & Biceps',
    emoji: '🦍',
    exercises: [
      { name: 'Tractions', sets: 4, reps: '8-12' },
      { name: 'Rowing barre', sets: 4, reps: '8-10' },
      { name: 'Tirage horizontal', sets: 4, reps: '10-12' },
      { name: 'Tirage vertical', sets: 3, reps: '12-15' },
      { name: 'Curl barre', sets: 4, reps: '10-12' },
      { name: 'Curl haltères alterné', sets: 3, reps: '12-15' },
    ],
  },
  'jambes': {
    name: 'Jambes',
    emoji: '🦵',
    exercises: [
      { name: 'Squat', sets: 5, reps: '6-8' },
      { name: 'Presse à cuisses', sets: 4, reps: '10-12' },
      { name: 'Fentes bulgares', sets: 3, reps: '10-12' },
      { name: 'Leg curl', sets: 3, reps: '12-15' },
      { name: 'Extensions mollets', sets: 4, reps: '15-20' },
      { name: 'Leg extension', sets: 3, reps: '12-15' },
    ],
  },
  'epaules': {
    name: 'Épaules & Abdos',
    emoji: '🏋️',
    exercises: [
      { name: 'Développé militaire', sets: 4, reps: '8-10' },
      { name: 'Élévations latérales', sets: 4, reps: '12-15' },
      { name: 'Oiseau haltères', sets: 4, reps: '12-15' },
      { name: 'Face pull', sets: 3, reps: '15-20' },
      { name: 'Crunch', sets: 4, reps: '15-20' },
      { name: 'Planche', sets: 3, reps: '60s' },
    ],
  },
};

export const WorkoutModule = () => {
  const [selectedProgram, setSelectedProgram] = useState<keyof WorkoutProgram>('pec-tris');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<{ [key: string]: number }>({});

  const startWorkout = () => {
    const program = WORKOUT_PROGRAMS[selectedProgram];
    const initialExercises: Exercise[] = program.exercises.map((ex, idx) => ({
      ...ex,
      completed: false,
      weight: currentWeight[ex.name] || 0,
    }));
    setExercises(initialExercises);
    setIsWorkoutStarted(true);
    toast.success('💪 Séance démarrée !', {
      description: `${program.name} - ${program.exercises.length} exercices. GO !`,
    });
  };

  const toggleExercise = (index: number) => {
    const updated = [...exercises];
    updated[index].completed = !updated[index].completed;
    setExercises(updated);
    
    if (updated[index].completed) {
      toast.success(`✅ ${updated[index].name} complété !`);
    }
  };

  const updateWeight = (index: number, weight: number) => {
    const updated = [...exercises];
    updated[index].weight = weight;
    setExercises(updated);
    setCurrentWeight({ ...currentWeight, [updated[index].name]: weight });
  };

  const completeWorkout = () => {
    const completed = exercises.filter(ex => ex.completed).length;
    const total = exercises.length;
    
    if (completed === total) {
      toast.success('🏆 SÉANCE TERMINÉE !', {
        description: 'Bravo champion ! Repos et progression assurée.',
      });
      setIsWorkoutStarted(false);
      setExercises([]);
    } else {
      toast.error(`⚠️ ${total - completed} exercices restants !`, {
        description: 'Termine tous les exercices avant de valider.',
      });
    }
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const progressPercentage = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#00ff00]/20 p-3 rounded-full">
            <Dumbbell className="w-6 h-6 text-[#00ff00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">MODULE MUSCULATION</h1>
            <p className="text-gray-400 text-sm">Programme 4 jours - Split classique</p>
          </div>
        </div>

        {!isWorkoutStarted ? (
          <>
            {/* Sélection du programme */}
            <div className="space-y-3 mb-6">
              <h3 className="font-black text-white mb-3">Choisis ta séance</h3>
              {Object.entries(WORKOUT_PROGRAMS).map(([key, program]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProgram(key as keyof WorkoutProgram)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedProgram === key
                      ? 'bg-[#00ff00]/20 border-[#00ff00]'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-white text-lg flex items-center gap-2">
                        <span className="text-2xl">{program.emoji}</span>
                        {program.name}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {program.exercises.length} exercices
                      </div>
                    </div>
                    {selectedProgram === key && (
                      <CheckCircle2 className="w-6 h-6 text-[#00ff00]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Aperçu des exercices */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
              <h4 className="font-black text-white mb-3">Exercices de la séance</h4>
              <div className="space-y-2">
                {WORKOUT_PROGRAMS[selectedProgram].exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-300">{ex.name}</span>
                    <span className="text-sm text-gray-500">{ex.sets} x {ex.reps}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={startWorkout}
              className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] font-black text-lg h-14"
            >
              <Play className="w-5 h-5 mr-2" />
              DÉMARRER LA SÉANCE
            </Button>

            {/* Tips */}
            <div className="mt-6 bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <div className="font-black text-orange-400 mb-2">🔥 TIPS PROGRESSION</div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Échauffement 5-10 min obligatoire</li>
                <li>• Progression : +2.5kg dès que tu fais toutes les séries</li>
                <li>• Temps de repos : 1-2 min (léger) / 2-3 min (lourd)</li>
                <li>• Form &gt; Poids. Technique parfaite = gains</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Progression de la séance */}
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-black text-white flex items-center gap-2">
                    <span>{WORKOUT_PROGRAMS[selectedProgram].emoji}</span>
                    {WORKOUT_PROGRAMS[selectedProgram].name}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {completedCount} / {exercises.length} exercices
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#00ff00]">
                    {Math.round(progressPercentage)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="bg-[#00ff00] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Liste des exercices */}
            <div className="space-y-3 mb-6">
              {exercises.map((exercise, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border-2 transition-all ${
                    exercise.completed
                      ? 'bg-[#00ff00]/20 border-[#00ff00]'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-black text-white text-lg mb-1">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {exercise.sets} séries × {exercise.reps} reps
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExercise(idx)}
                        className="ml-4"
                      >
                        {exercise.completed ? (
                          <CheckCircle2 className="w-8 h-8 text-[#00ff00]" />
                        ) : (
                          <Circle className="w-8 h-8 text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400">Charge:</label>
                      <Input
                        type="number"
                        value={exercise.weight || ''}
                        onChange={(e) => updateWeight(idx, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-sm text-gray-400">kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (confirm('Abandonner la séance ?')) {
                    setIsWorkoutStarted(false);
                    setExercises([]);
                  }
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-400"
              >
                Abandonner
              </Button>
              <Button
                onClick={completeWorkout}
                className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Terminer la séance
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};