import { useState } from 'react';
import { Dumbbell, Trophy, Activity, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { WorkoutModule } from './WorkoutModule';
import { FootballModule } from './FootballModule';

export const SportModule = () => {
  const [selectedSport, setSelectedSport] = useState<'menu' | 'musculation' | 'football'>('menu');

  if (selectedSport === 'musculation') {
    return (
      <div>
        <div className="bg-black p-4 border-b border-gray-800">
          <Button
            onClick={() => setSelectedSport('menu')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            ← Retour Sport
          </Button>
        </div>
        <WorkoutModule />
      </div>
    );
  }

  if (selectedSport === 'football') {
    return (
      <div>
        <div className="bg-black p-4 border-b border-gray-800">
          <Button
            onClick={() => setSelectedSport('menu')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            ← Retour Sport
          </Button>
        </div>
        <FootballModule />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#00ff00]/20 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-[#00ff00]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">SPORT</h1>
              <p className="text-gray-400">Développe ton physique d'athlète</p>
            </div>
          </div>
        </div>

        {/* Sport Options */}
        <div className="space-y-4">
          {/* Musculation Card */}
          <button
            onClick={() => setSelectedSport('musculation')}
            className="w-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-6 text-left hover:border-red-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/30 p-4 rounded-full">
                  <Dumbbell className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">MUSCULATION</h2>
                  <p className="text-gray-400">4 programmes : Pecs/Tris, Jambes, Dos/Bis, Épaules</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-bold">Programme complet</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          {/* Football Card */}
          <button
            onClick={() => setSelectedSport('football')}
            className="w-full bg-gradient-to-br from-green-500/20 to-blue-500/20 border-2 border-green-500/50 rounded-2xl p-6 text-left hover:border-green-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/30 p-4 rounded-full text-4xl">
                  ⚽
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">FOOTBALL</h2>
                  <p className="text-gray-400">Technique, physique et mental de champion</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-bold">Entraînement pro</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="font-black text-lg mb-4 text-white">📊 PROGRESSION SPORTIVE</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-black text-red-400">0</div>
              <div className="text-xs text-gray-400 mt-1">Séances muscu</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-black text-green-400">0</div>
              <div className="text-xs text-gray-400 mt-1">Séances football</div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            💪 <span className="font-black text-[#00ff00]">Mens sana in corpore sano</span> - Un esprit sain dans un corps sain. Le sport booste ta concentration et tes résultats scolaires !
          </p>
        </div>
      </div>
    </div>
  );
};
