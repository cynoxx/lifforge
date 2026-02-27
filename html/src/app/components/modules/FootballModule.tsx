import { useState } from 'react';
import { Timer, Target, Zap, Trophy, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface Drill {
  id: string;
  name: string;
  category: 'technique' | 'physique' | 'tactique';
  duration: number;
  description: string;
  completed: boolean;
}

export const FootballModule = () => {
  const [selectedCategory, setSelectedCategory] = useState<'technique' | 'physique' | 'tactique' | null>(null);
  const [drills, setDrills] = useState<Drill[]>([
    // Technique
    { id: '1', name: 'Conduite de balle', category: 'technique', duration: 10, description: '100m aller-retour en slalom', completed: false },
    { id: '2', name: 'Passes courtes', category: 'technique', duration: 15, description: 'Précision avec les 2 pieds', completed: false },
    { id: '3', name: 'Contrôle orienté', category: 'technique', duration: 10, description: 'Réception et accélération', completed: false },
    { id: '4', name: 'Frappes au but', category: 'technique', duration: 15, description: '20 tirs variés (pied droit/gauche)', completed: false },
    { id: '5', name: 'Jongles', category: 'technique', duration: 10, description: 'Améliore ton toucher de balle', completed: false },
    
    // Physique
    { id: '6', name: 'Sprints 30m', category: 'physique', duration: 15, description: '10 sprints avec récup 30s', completed: false },
    { id: '7', name: 'Course endurance', category: 'physique', duration: 20, description: 'Footing 3-4km rythme soutenu', completed: false },
    { id: '8', name: 'Changements direction', category: 'physique', duration: 10, description: 'Agilité et explosivité', completed: false },
    { id: '9', name: 'Sauts pliométriques', category: 'physique', duration: 10, description: '3x10 sauts box/haies', completed: false },
    { id: '10', name: 'Core training', category: 'physique', duration: 10, description: 'Gainage + stabilité', completed: false },
    
    // Tactique
    { id: '11', name: 'Placement défensif', category: 'tactique', duration: 15, description: 'Visualisation et positionnement', completed: false },
    { id: '12', name: 'Appels de balle', category: 'tactique', duration: 10, description: 'Timing et courses', completed: false },
    { id: '13', name: 'Vision du jeu', category: 'tactique', duration: 15, description: 'Lecture du match et anticipation', completed: false },
    { id: '14', name: '1v1 offensif', category: 'tactique', duration: 10, description: 'Dribbles et feintes', completed: false },
    { id: '15', name: '1v1 défensif', category: 'tactique', duration: 10, description: 'Marquage et récupération', completed: false },
  ]);

  const handleToggleDrill = (drillId: string) => {
    setDrills(drills.map(d => 
      d.id === drillId ? { ...d, completed: !d.completed } : d
    ));
    const drill = drills.find(d => d.id === drillId);
    if (drill && !drill.completed) {
      toast.success(`✅ ${drill.name} complété ! 🔥`);
    }
  };

  const categories = [
    { id: 'technique' as const, name: 'TECHNIQUE', emoji: '⚽', color: 'blue' },
    { id: 'physique' as const, name: 'PHYSIQUE', emoji: '💨', color: 'red' },
    { id: 'tactique' as const, name: 'TACTIQUE', emoji: '🧠', color: 'purple' },
  ];

  const filteredDrills = selectedCategory 
    ? drills.filter(d => d.category === selectedCategory)
    : drills;

  const completedCount = filteredDrills.filter(d => d.completed).length;
  const totalDuration = filteredDrills.reduce((sum, d) => sum + d.duration, 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 p-4 rounded-full text-4xl">
              ⚽
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">FOOTBALL</h1>
              <p className="text-gray-400">Entraînement de champion</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-green-400">{completedCount}</div>
              <div className="text-xs text-gray-400">Exercices complétés</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-blue-400">{totalDuration}</div>
              <div className="text-xs text-gray-400">Minutes au total</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="text-2xl font-black text-purple-400">{drills.length}</div>
              <div className="text-xs text-gray-400">Exercices dispo</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-black text-sm whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-[#00ff00] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            TOUT
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-black text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? `bg-${cat.color}-500 text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Drills List */}
        <div className="space-y-3">
          {filteredDrills.map((drill) => {
            const category = categories.find(c => c.id === drill.category);
            return (
              <div
                key={drill.id}
                className={`bg-gray-900 border-2 rounded-xl p-4 transition-all ${
                  drill.completed
                    ? 'border-[#00ff00] bg-[#00ff00]/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{category?.emoji}</span>
                      <h3 className={`font-black text-lg ${drill.completed ? 'text-[#00ff00]' : 'text-white'}`}>
                        {drill.name}
                      </h3>
                      {drill.completed && (
                        <CheckCircle className="w-5 h-5 text-[#00ff00]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{drill.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Timer className="w-4 h-4" />
                        <span>{drill.duration} min</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full font-bold ${
                        drill.category === 'technique' ? 'bg-blue-500/20 text-blue-400' :
                        drill.category === 'physique' ? 'bg-red-500/20 text-red-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {category?.name}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleToggleDrill(drill.id)}
                    className={`${
                      drill.completed
                        ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        : 'bg-[#00ff00] text-black hover:bg-[#00dd00]'
                    } font-black`}
                  >
                    {drill.completed ? '✓ Fait' : 'Valider'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coach Tips */}
        <div className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-[#00ff00] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-black text-white mb-2">🎯 CONSEIL DU COACH</h3>
              <p className="text-sm text-gray-300">
                Un bon footballeur travaille les 3 piliers : <span className="text-blue-400 font-bold">Technique</span>, <span className="text-red-400 font-bold">Physique</span>, et <span className="text-purple-400 font-bold">Tactique</span>. Consacre 30-45min par jour minimum. Les pros s'entraînent 6h/jour !
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setDrills(drills.map(d => ({ ...d, completed: false })));
              toast.success('Exercices réinitialisés');
            }}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-800"
          >
            Réinitialiser
          </Button>
          <Button
            onClick={() => {
              const completed = drills.filter(d => d.completed).length;
              toast.success(`${completed} exercices complétés ! 💪`);
            }}
            className="bg-green-600 text-white hover:bg-green-700 font-black"
          >
            Voir progression
          </Button>
        </div>
      </div>
    </div>
  );
};
