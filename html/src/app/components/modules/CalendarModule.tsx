import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { ScheduledBlock } from '../../types';

interface CalendarModuleProps {
  blocks: ScheduledBlock[];
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const CalendarModule = ({ blocks }: CalendarModuleProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getBlocksForDay = (date: Date) => {
    return blocks.filter(block => 
      isSameDay(new Date(block.date), date)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'etudes': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'muscu': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'course': return 'bg-green-500/20 border-green-500 text-green-400';
      case 'youtube': return 'bg-purple-500/20 border-purple-500 text-purple-400';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  const getBlockEmoji = (type: string) => {
    switch (type) {
      case 'etudes': return '📚';
      case 'muscu': return '💪';
      case 'course': return '🏃';
      case 'youtube': return '🎬';
      default: return '⚡';
    }
  };

  const getBlockLabel = (type: string) => {
    switch (type) {
      case 'etudes': return 'Études';
      case 'muscu': return 'Muscu';
      case 'course': return 'Course';
      case 'youtube': return 'YouTube';
      default: return 'Activité';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#00ff00]/20 p-3 rounded-full">
            <Calendar className="w-6 h-6 text-[#00ff00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">PLANNING HEBDOMADAIRE</h1>
            <p className="text-gray-400 text-sm">Vue d'ensemble de ta semaine</p>
          </div>
        </div>

        {/* Navigation semaine */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={goToPreviousWeek}
            variant="outline"
            size="icon"
            className="border-gray-700 text-gray-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="font-black text-white text-lg">
              {format(weekDays[0], 'd MMM', { locale: fr })} - {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
            </div>
            <Button
              onClick={goToToday}
              variant="ghost"
              size="sm"
              className="text-[#00ff00] hover:text-[#00dd00] mt-1"
            >
              Aujourd'hui
            </Button>
          </div>
          
          <Button
            onClick={goToNextWeek}
            variant="outline"
            size="icon"
            className="border-gray-700 text-gray-400"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Grille hebdomadaire */}
        <div className="grid grid-cols-1 gap-4">
          {weekDays.map((day, dayIndex) => {
            const dayBlocks = getBlocksForDay(day);
            const isToday = isSameDay(day, new Date());
            const completedBlocks = dayBlocks.filter(b => b.completed).length;
            const totalBlocks = dayBlocks.length;

            return (
              <div
                key={dayIndex}
                className={`rounded-lg border-2 transition-all ${
                  isToday
                    ? 'bg-[#00ff00]/10 border-[#00ff00]'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className={`font-black ${isToday ? 'text-[#00ff00]' : 'text-white'}`}>
                        {DAYS_OF_WEEK[dayIndex]}
                      </div>
                      <div className="text-sm text-gray-400">
                        {format(day, 'd MMMM', { locale: fr })}
                      </div>
                    </div>
                    {totalBlocks > 0 && (
                      <div className="text-right">
                        <div className={`text-sm font-black ${
                          completedBlocks === totalBlocks ? 'text-[#00ff00]' : 'text-gray-400'
                        }`}>
                          {completedBlocks} / {totalBlocks}
                        </div>
                        <div className="text-xs text-gray-500">complété</div>
                      </div>
                    )}
                  </div>

                  {dayBlocks.length === 0 ? (
                    <div className="text-center py-6 text-gray-600 text-sm">
                      Repos ou pas de sessions planifiées
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          className={`border rounded-lg p-3 ${getBlockColor(block.type)} ${
                            block.completed ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getBlockEmoji(block.type)}</span>
                              <div>
                                <div className="font-black text-sm">
                                  {getBlockLabel(block.type)}
                                </div>
                                <div className="text-xs opacity-75">
                                  {block.startTime} - {block.endTime}
                                </div>
                              </div>
                            </div>
                            {block.completed && (
                              <div className="text-xs font-black">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistiques de la semaine */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-white mb-1">
              {blocks.filter(b => b.completed).length}
            </div>
            <div className="text-xs text-gray-400">Sessions complétées</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-[#00ff00] mb-1">
              {blocks.length}
            </div>
            <div className="text-xs text-gray-400">Total planifié</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className="text-2xl font-black text-blue-400 mb-1">
              {blocks.length > 0 ? Math.round((blocks.filter(b => b.completed).length / blocks.length) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-400">Taux de réussite</div>
          </div>
        </div>
      </div>
    </div>
  );
};
