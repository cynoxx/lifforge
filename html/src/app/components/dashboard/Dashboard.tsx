import { useState, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { Timeline } from './Timeline';
import { CoachMessage } from './CoachMessage';
import { PlanningGenerator } from './PlanningGenerator';
import { QuickAddBlock } from './QuickAddBlock';
import { ScheduleSetup } from '../planning/ScheduleSetup';
import { BottomNav } from '../navigation/BottomNav';
import { StudiesModule } from '../modules/StudiesModule';
import { SportModule } from '../modules/SportModule';
import { CoursesModule } from '../modules/CoursesModule';
import { CalendarModule } from '../modules/CalendarModule';
import { ProfileModule } from '../modules/ProfileModule';
import { AppState, ScheduledBlock, FixedScheduleSlot, Grade } from '../../types';
import { format, parse, isBefore } from 'date-fns';
import { calculateAverageProjection } from '../../utils/scheduler';
import { Settings, Trophy } from 'lucide-react';
import { Button } from '../ui/button';

interface DashboardProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onReset: () => void;
  onLogout?: () => void;
}

export const Dashboard = ({ state, onUpdateState, onReset, onLogout }: DashboardProps) => {
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextSession, setNextSession] = useState<{ time: string; type: string } | undefined>();
  const [currentView, setCurrentView] = useState<'dashboard' | 'studies' | 'sport' | 'courses' | 'calendar' | 'profile'>('dashboard');
  const [showScheduleSetup, setShowScheduleSetup] = useState(false);

  useEffect(() => {
    // Trouver la prochaine session
    const now = new Date();
    const todayBlocks = state.scheduledBlocks
      .filter(block => block.date === currentDate && !block.completed)
      .sort((a, b) => {
        const timeA = parse(a.startTime, 'HH:mm', new Date());
        const timeB = parse(b.startTime, 'HH:mm', new Date());
        return timeA.getTime() - timeB.getTime();
      });

    const upcoming = todayBlocks.find(block => {
      const blockStart = parse(block.startTime, 'HH:mm', new Date());
      return blockStart > now;
    });

    if (upcoming) {
      setNextSession({ time: upcoming.startTime, type: upcoming.type });
    }
  }, [state.scheduledBlocks, currentDate]);

  const handleBlockComplete = (blockId: string, photo?: string) => {
    const updatedBlocks = state.scheduledBlocks.map(block =>
      block.id === blockId ? { ...block, completed: true, checkInPhoto: photo } : block
    );

    // Calculer le nouveau streak
    const todayCompleted = updatedBlocks.filter(
      b => b.date === currentDate && b.completed
    ).length;
    const todayTotal = updatedBlocks.filter(b => b.date === currentDate).length;

    let newStreak = state.streak;
    let newMissed = state.missedSessions;

    // Si toutes les sessions du jour sont complétées, incrémenter le streak
    if (todayCompleted === todayTotal && todayTotal > 0) {
      newStreak = state.streak + 1;
      newMissed = 0; // Reset missed sessions on successful day
    }

    // Ajouter la session d'étude si c'est une session d'études
    const block = state.scheduledBlocks.find(b => b.id === blockId);
    let newStudySessions = [...state.studySessions];
    if (block?.type === 'etudes') {
      newStudySessions.push({
        id: `study-${Date.now()}`,
        date: currentDate,
        subject: 'Général',
        duration: 45,
        completed: true,
        pomodorosCompleted: 1,
      });
    }

    onUpdateState({
      scheduledBlocks: updatedBlocks,
      streak: newStreak,
      missedSessions: newMissed,
      studySessions: newStudySessions,
    });
  };

  const handleBlockMissed = (blockId: string, reason: string) => {
    const updatedBlocks = state.scheduledBlocks.map(block =>
      block.id === blockId ? { ...block, missedReason: reason } : block
    );

    const newMissed = state.missedSessions + 1;
    let newStreak = state.streak;

    // Si 3 sessions ratées, reset le streak
    if (newMissed >= 3) {
      newStreak = 0;
    }

    onUpdateState({
      scheduledBlocks: updatedBlocks,
      missedSessions: newMissed,
      streak: newStreak,
    });
  };

  if (!state.userProfile) return null;

  const projectedAverage = calculateAverageProjection(
    state.userProfile.currentAverage,
    state.userProfile.targetAverage,
    state.studySessions.length,
    Math.floor((new Date().getTime() - new Date(state.userProfile.startDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Render different views based on currentView
  if (currentView === 'studies') {
    return (
      <>
        <StudiesModule />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </>
    );
  }

  if (currentView === 'sport') {
    return (
      <>
        <SportModule />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </>
    );
  }

  if (currentView === 'courses') {
    return (
      <>
        <CoursesModule 
          state={state}
          onUpdateGrades={(grades: Grade[]) => {
            if (!state.userProfile) return;
            onUpdateState({
              userProfile: {
                ...state.userProfile,
                grades,
              },
            });
          }}
          onUpdateAverage={(average: number) => {
            if (!state.userProfile) return;
            onUpdateState({
              userProfile: {
                ...state.userProfile,
                currentAverage: average,
              },
            });
          }}
        />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </>
    );
  }

  if (currentView === 'calendar') {
    return (
      <>
        <CalendarModule blocks={state.scheduledBlocks} />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </>
    );
  }

  if (currentView === 'profile') {
    return (
      <>
        <ProfileModule 
          state={state} 
          onReset={onReset}
          onLogout={onLogout}
          onUpdateProfile={(updates) => {
            if (!state.userProfile) return;
            onUpdateState({
              userProfile: {
                ...state.userProfile,
                ...updates,
              },
            });
          }}
        />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </>
    );
  }

  // Show schedule setup if requested
  if (showScheduleSetup) {
    return (
      <ScheduleSetup
        onComplete={(slots: FixedScheduleSlot[]) => {
          onUpdateState({ fixedScheduleSlots: slots });
          setShowScheduleSetup(false);
        }}
        onSkip={() => setShowScheduleSetup(false)}
      />
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader
        name={state.userProfile.name}
        streak={state.streak}
        currentAverage={state.userProfile.currentAverage}
        projectedAverage={projectedAverage}
        startDate={state.userProfile.startDate}
      />

      <CoachMessage
        name={state.userProfile.name}
        streak={state.streak}
        missedSessions={state.missedSessions}
        nextSession={nextSession}
      />

      {/* Planning Generator */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-white text-lg">Planning Intelligent</h3>
          <QuickAddBlock 
            onAddBlock={(block) => {
              onUpdateState({ 
                scheduledBlocks: [...state.scheduledBlocks, block]
              });
            }}
          />
        </div>
        <PlanningGenerator
          state={state}
          onGeneratePlanning={(blocks) => {
            onUpdateState({ scheduledBlocks: blocks });
          }}
          onOpenScheduleSetup={() => setShowScheduleSetup(true)}
        />
      </div>

      <Timeline
        date={currentDate}
        blocks={state.scheduledBlocks}
        onBlockComplete={handleBlockComplete}
        onBlockMissed={handleBlockMissed}
      />

      {/* Badges & Stats */}
      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Badges & Accomplissements
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className={`border rounded-lg p-4 text-center ${
            state.streak >= 7 ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-800/50 border-gray-700'
          }`}>
            <div className="text-3xl mb-2">🥉</div>
            <div className="font-black text-sm text-white">Warrior</div>
            <div className="text-xs text-gray-400">7 jours streak</div>
          </div>

          <div className={`border rounded-lg p-4 text-center ${
            state.streak >= 30 ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-800/50 border-gray-700'
          }`}>
            <div className="text-3xl mb-2">🥈</div>
            <div className="font-black text-sm text-white">Champion</div>
            <div className="text-xs text-gray-400">30 jours streak</div>
          </div>

          <div className={`border rounded-lg p-4 text-center ${
            state.streak >= 90 ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-800/50 border-gray-700'
          }`}>
            <div className="text-3xl mb-2">🥇</div>
            <div className="font-black text-sm text-white">APEX Legend</div>
            <div className="text-xs text-gray-400">90 jours streak</div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full border-gray-700 text-gray-400 hover:bg-gray-900 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Réinitialiser l'application
        </Button>
      </div>

      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};