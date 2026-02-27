import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BookOpen, Play, Pause, RotateCcw, Plus, Clock, TrendingUp, Brain } from 'lucide-react';
import { toast } from 'sonner';

const SUBJECTS = [
  'Mathématiques',
  'Physique-Chimie',
  'SVT',
  'Philosophie',
  'Histoire-Géo',
  'Anglais',
  'Espagnol',
  'Français',
  'Autre',
];

interface StudySession {
  subject: string;
  duration: number;
  date: string;
  pomodorosCompleted: number;
}

export const StudiesModule = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [currentSubject, setCurrentSubject] = useState(SUBJECTS[0]);
  const [pomodorosToday, setPomodorosToday] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      // Pomodoro complété
      const newPomodoros = pomodorosToday + 1;
      setPomodorosToday(newPomodoros);
      setTotalMinutesToday(prev => prev + 25);
      
      // Sauvegarder la session
      const newSession: StudySession = {
        subject: currentSubject,
        duration: 25,
        date: new Date().toISOString(),
        pomodorosCompleted: 1,
      };
      setSessions(prev => [...prev, newSession]);
      
      toast.success('🎯 Pomodoro complété !', {
        description: `${newPomodoros} Pomodoros aujourd'hui. Prends une pause de 5 min !`,
      });
      
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      // Pause terminée
      toast.success('⚡ Pause terminée !', {
        description: 'C\'est reparti pour 25 minutes de concentration !',
      });
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const total = mode === 'work' ? 25 * 60 : 5 * 60;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#00ff00]/20 p-3 rounded-full">
            <BookOpen className="w-6 h-6 text-[#00ff00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">MODULE ÉTUDES</h1>
            <p className="text-gray-400 text-sm">Méthode Pomodoro - 25 min focus, 5 min pause</p>
          </div>
        </div>

        {/* Stats du jour */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Temps total</span>
            </div>
            <div className="text-2xl font-black text-white">{totalMinutesToday} min</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Pomodoros</span>
            </div>
            <div className="text-2xl font-black text-[#00ff00]">{pomodorosToday}</div>
          </div>
        </div>

        {/* Timer principal */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 rounded-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className={`inline-block px-4 py-2 rounded-full mb-4 ${
              mode === 'work' 
                ? 'bg-[#00ff00]/20 text-[#00ff00]' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              <span className="font-black text-sm">
                {mode === 'work' ? '📚 SESSION ÉTUDE' : '☕ PAUSE'}
              </span>
            </div>
            
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Circle progress */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#1f2937"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke={mode === 'work' ? '#00ff00' : '#3b82f6'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgressPercentage() / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-black text-white">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {mode === 'work' && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Matière</label>
                <Select value={currentSubject} onValueChange={setCurrentSubject}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white max-w-xs mx-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={`font-black ${
                  isRunning
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-[#00ff00] hover:bg-[#00dd00] text-black'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    PAUSE
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    START
                  </>
                )}
              </Button>
              <Button
                onClick={resetTimer}
                size="lg"
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Objectif quotidien */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00ff00]" />
              <span className="font-black text-white">Objectif quotidien</span>
            </div>
            <span className="text-sm text-gray-400">{pomodorosToday} / 6 Pomodoros</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-[#00ff00] h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((pomodorosToday / 6) * 100, 100)}%` }}
            />
          </div>
          {pomodorosToday >= 6 && (
            <div className="mt-3 bg-[#00ff00]/20 border border-[#00ff00] rounded-lg p-2 text-center">
              <span className="text-[#00ff00] text-sm font-black">🎯 Objectif atteint ! Machine !</span>
            </div>
          )}
        </div>

        {/* Sessions récentes */}
        <div>
          <h3 className="font-black text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00ff00]" />
            Sessions récentes
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune session aujourd'hui. Lance ton premier Pomodoro !
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(-5).reverse().map((session, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-white">{session.subject}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(session.date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00ff00] font-black">{session.duration} min</div>
                      <div className="text-xs text-gray-400">1 Pomodoro</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-500/20 border border-blue-500 rounded-lg p-4">
          <div className="font-black text-blue-400 mb-2">💡 TIPS PRO</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Téléphone en mode avion pendant les sessions</li>
            <li>• 1 Pomodoro = 1 sujet pour rester focus</li>
            <li>• Objectif minimum : 6 Pomodoros/jour (2h30)</li>
            <li>• Révisions espacées : J0, J1, J3, J7, J14</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
