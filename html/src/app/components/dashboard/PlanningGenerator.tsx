import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { generateDailyPlanning, generateWeeklyPlanning, analyzePlanning } from '../../utils/planningGenerator';
import { AppState, ScheduledBlock, FixedScheduleSlot } from '../../types';
import { toast } from 'sonner';

interface PlanningGeneratorProps {
  state: AppState;
  onGeneratePlanning: (blocks: ScheduledBlock[]) => void;
  onOpenScheduleSetup: () => void;
}

export const PlanningGenerator = ({ state, onGeneratePlanning, onOpenScheduleSetup }: PlanningGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const hasFixedSchedule = state.fixedScheduleSlots && state.fixedScheduleSlots.length > 0;

  const handleGenerateToday = () => {
    if (!hasFixedSchedule) {
      onOpenScheduleSetup();
      return;
    }

    setIsGenerating(true);
    
    // Simuler un délai pour l'effet "IA qui travaille"
    setTimeout(() => {
      const blocks = generateDailyPlanning(state.fixedScheduleSlots || []);
      onGeneratePlanning(blocks);
      
      toast.success('✨ Planning généré !', {
        description: `${blocks.length} sessions productives ajoutées à ton planning.`,
      });
      
      setIsGenerating(false);
      setShowAnalysis(true);
    }, 1500);
  };

  const handleGenerateWeek = () => {
    if (!hasFixedSchedule) {
      onOpenScheduleSetup();
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const blocks = generateWeeklyPlanning(state.fixedScheduleSlots || []);
      onGeneratePlanning(blocks);
      
      toast.success('✨ Planning hebdomadaire généré !', {
        description: `${blocks.length} sessions planifiées pour la semaine.`,
      });
      
      setIsGenerating(false);
      setShowAnalysis(true);
    }, 2000);
  };

  const analysis = state.scheduledBlocks.length > 0 
    ? analyzePlanning(state.scheduledBlocks)
    : null;

  return (
    <div className="space-y-4">
      {/* Boutons de génération */}
      <div className="bg-gradient-to-br from-[#00ff00]/20 to-[#00dd00]/10 border-2 border-[#00ff00] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#00ff00]/30 p-3 rounded-full">
            <Sparkles className="w-6 h-6 text-[#00ff00]" />
          </div>
          <div>
            <h3 className="font-black text-white text-lg">IA PLANNING GENERATOR</h3>
            <p className="text-sm text-gray-300">
              {hasFixedSchedule 
                ? 'Génère automatiquement tes sessions productives'
                : 'Configure d\'abord ton emploi du temps'}
            </p>
          </div>
        </div>

        {!hasFixedSchedule && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <div className="font-black text-yellow-400 mb-1">Configuration requise</div>
                <p className="text-sm text-gray-300">
                  Pour que l'IA génère ton planning, indique d'abord tes cours, repas et activités fixes.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={hasFixedSchedule ? handleGenerateToday : onOpenScheduleSetup}
            disabled={isGenerating}
            className="bg-[#00ff00] text-black hover:bg-[#00dd00] font-black h-14"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                Génération...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Planning du jour
              </>
            )}
          </Button>

          <Button
            onClick={hasFixedSchedule ? handleGenerateWeek : onOpenScheduleSetup}
            disabled={isGenerating}
            variant="outline"
            className="border-2 border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00]/20 font-black h-14"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-[#00ff00] border-t-transparent rounded-full animate-spin mr-2" />
                Génération...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Semaine complète
              </>
            )}
          </Button>
        </div>

        {hasFixedSchedule && (
          <button
            onClick={onOpenScheduleSetup}
            className="w-full mt-3 text-sm text-gray-400 hover:text-[#00ff00] transition-colors"
          >
            Modifier mes créneaux fixes
          </button>
        )}
      </div>

      {/* Analyse du planning */}
      {analysis && showAnalysis && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h4 className="font-black text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Analyse du planning
          </h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Heures d'études</div>
              <div className={`text-2xl font-black ${
                analysis.studyHours >= 3 ? 'text-[#00ff00]' : 'text-yellow-400'
              }`}>
                {analysis.studyHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500 mt-1">Objectif: 3h/jour</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Séances muscu</div>
              <div className={`text-2xl font-black ${
                analysis.workoutSessions >= 4 ? 'text-[#00ff00]' : 'text-yellow-400'
              }`}>
                {analysis.workoutSessions}
              </div>
              <div className="text-xs text-gray-500 mt-1">Objectif: 4/semaine</div>
            </div>
          </div>

          <div className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`text-sm p-3 rounded-lg ${
                  rec.startsWith('✅')
                    ? 'bg-[#00ff00]/20 text-[#00ff00]'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats des créneaux fixes */}
      {hasFixedSchedule && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Créneaux configurés</span>
            </div>
            <span className="text-sm font-black text-white">
              {state.fixedScheduleSlots?.length || 0} créneaux
            </span>
          </div>
          <div className="text-xs text-gray-500">
            L'IA optimise automatiquement les temps libres pour maximiser ta productivité
          </div>
        </div>
      )}
    </div>
  );
};
