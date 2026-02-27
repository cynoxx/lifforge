import { Target, Flame, TrendingUp, Calendar } from 'lucide-react';
import { getDaysToGoal } from '../../utils/scheduler';

interface DashboardHeaderProps {
  name: string;
  streak: number;
  currentAverage: number;
  projectedAverage: number;
  startDate: string;
}

export const DashboardHeader = ({ 
  name, 
  streak, 
  currentAverage, 
  projectedAverage,
  startDate 
}: DashboardHeaderProps) => {
  const daysToGoal = getDaysToGoal(startDate);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border-b border-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">
              Salut {name} 👊
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#00ff00]/20 px-4 py-2 rounded-full">
            <Flame className="w-5 h-5 text-[#00ff00]" />
            <span className="text-2xl font-black text-[#00ff00]">{streak}</span>
            <span className="text-sm text-gray-300">jours</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Moyenne actuelle</span>
            </div>
            <div className="text-2xl font-black text-white">
              {currentAverage.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#00ff00]" />
              <span className="text-xs text-gray-400">Projection</span>
            </div>
            <div className="text-2xl font-black text-[#00ff00]">
              {projectedAverage.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Jours restants</span>
            </div>
            <div className="text-2xl font-black text-white">
              {daysToGoal}
            </div>
          </div>
        </div>

        {projectedAverage >= 18 ? (
          <div className="mt-4 bg-[#00ff00]/20 border border-[#00ff00] rounded-lg p-3 text-center">
            <span className="text-[#00ff00] font-black">🎯 Sur la bonne voie pour 18+ !</span>
          </div>
        ) : (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-center">
            <span className="text-yellow-500 font-black">⚡ Accélère le rythme pour atteindre 18+ !</span>
          </div>
        )}
      </div>
    </div>
  );
};
