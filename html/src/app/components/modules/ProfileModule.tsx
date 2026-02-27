import { useState, useRef } from 'react';
import { User, Award, TrendingUp, Zap, Target, Calendar, BookOpen, Dumbbell, Camera, Edit2, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { AppState } from '../../types';
import { getDaysToGoal, calculateAverageProjection } from '../../utils/scheduler';
import { toast } from 'sonner';

interface ProfileModuleProps {
  state: AppState;
  onReset: () => void;
  onUpdateProfile: (updates: { photo?: string; bio?: string }) => void;
  onLogout?: () => void;
}

export const ProfileModule = ({ state, onReset, onUpdateProfile, onLogout }: ProfileModuleProps) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(state.userProfile?.bio || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!state.userProfile) return null;

  const daysElapsed = Math.floor(
    (new Date().getTime() - new Date(state.userProfile.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const projectedAverage = calculateAverageProjection(
    state.userProfile.currentAverage,
    state.userProfile.targetAverage,
    state.studySessions.length,
    daysElapsed
  );

  const daysToGoal = getDaysToGoal(state.userProfile.startDate);
  const totalDays = 180;
  const progressDays = totalDays - daysToGoal;
  const progressPercentage = (progressDays / totalDays) * 100;

  const completedSessions = state.scheduledBlocks.filter(b => b.completed).length;
  const totalSessions = state.scheduledBlocks.length;
  const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const studyMinutes = state.studySessions.reduce((sum, s) => sum + s.duration, 0);
  const workoutSessions = state.scheduledBlocks.filter(b => b.type === 'muscu' && b.completed).length;

  const badges = [
    { id: 'warrior', name: 'Warrior', emoji: '🥉', requirement: 7, unlocked: state.streak >= 7 },
    { id: 'champion', name: 'Champion', emoji: '🥈', requirement: 30, unlocked: state.streak >= 30 },
    { id: 'legend', name: 'APEX Legend', emoji: '🥇', requirement: 90, unlocked: state.streak >= 90 },
    { id: 'scholar', name: 'Scholar', emoji: '📚', requirement: 50, unlocked: state.studySessions.length >= 50 },
    { id: 'athlete', name: 'Athlete', emoji: '💪', requirement: 20, unlocked: workoutSessions >= 20 },
    { id: 'perfect', name: 'Perfect Week', emoji: '⭐', requirement: 100, unlocked: successRate >= 100 && completedSessions >= 7 },
  ];

  const unlockedBadges = badges.filter(b => b.unlocked);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', {
        description: 'Choisis une image (JPG, PNG, etc.)',
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde', {
        description: 'Taille maximum : 5MB',
      });
      return;
    }

    // Lire le fichier et convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onUpdateProfile({ photo: base64String });
      toast.success('✅ Photo mise à jour !');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBio = () => {
    onUpdateProfile({ bio: bioText });
    setIsEditingBio(false);
    toast.success('✅ Bio mise à jour !');
  };

  const handleCancelBio = () => {
    setBioText(state.userProfile?.bio || '');
    setIsEditingBio(false);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Profile */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            {/* Photo de profil */}
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              
              {state.userProfile.photo ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#00ff00]">
                  <img
                    src={state.userProfile.photo}
                    alt={state.userProfile.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 bg-[#00ff00]/20 rounded-full flex items-center justify-center border-4 border-[#00ff00] hover:bg-[#00ff00]/30 transition-colors group"
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-[#00ff00] mx-auto mb-1" />
                    <span className="text-[10px] text-[#00ff00] font-black">AJOUTER</span>
                  </div>
                </button>
              )}
            </div>

            {/* Info profil */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white">{state.userProfile.name}</h1>
              <div className="text-gray-400 mb-3">{state.userProfile.age} ans • Terminale</div>

              {/* Bio */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                {!isEditingBio ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {state.userProfile.bio ? (
                        <p className="text-sm text-gray-300">{state.userProfile.bio}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Ajoute une bio pour te présenter...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Ex: Lycéen motivé en quête d'excellence. Objectif : 18+ et physique d'athlète ! 💪"
                      className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                      maxLength={200}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{bioText.length}/200</span>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancelBio}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-400"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                        <Button
                          onClick={handleSaveBio}
                          size="sm"
                          className="bg-[#00ff00] text-black hover:bg-[#00dd00]"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Sauvegarder
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Moyenne actuelle</div>
              <div className="text-2xl font-black text-white">{state.userProfile.currentAverage}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Objectif</div>
              <div className="text-2xl font-black text-[#00ff00]">{state.userProfile.targetAverage}</div>
            </div>
          </div>
        </div>

        {/* Progression vers l'objectif */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#00ff00]" />
            <h2 className="font-black text-white text-lg">Progression vers l'objectif</h2>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Jour {progressDays} / {totalDays}</span>
              <span className="text-[#00ff00] font-black">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-[#00ff00] to-[#00dd00] h-4 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-[#00ff00]">{daysToGoal}</div>
              <div className="text-xs text-gray-400 mt-1">Jours restants</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-blue-400">{projectedAverage.toFixed(1)}</div>
              <div className="text-xs text-gray-400 mt-1">Projection</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-purple-400">{Math.round(successRate)}%</div>
              <div className="text-xs text-gray-400 mt-1">Taux réussite</div>
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#00ff00]" />
            <h2 className="font-black text-white text-lg">Statistiques</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Streak actuel</span>
              </div>
              <div className="text-3xl font-black text-white">{state.streak}</div>
              <div className="text-xs text-gray-500 mt-1">jours consécutifs</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Sessions totales</span>
              </div>
              <div className="text-3xl font-black text-white">{completedSessions}</div>
              <div className="text-xs text-gray-500 mt-1">sur {totalSessions} planifiées</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Temps d'étude</span>
              </div>
              <div className="text-3xl font-black text-white">{Math.floor(studyMinutes / 60)}h</div>
              <div className="text-xs text-gray-500 mt-1">{state.studySessions.length} sessions</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Séances muscu</span>
              </div>
              <div className="text-3xl font-black text-white">{workoutSessions}</div>
              <div className="text-xs text-gray-500 mt-1">complétées</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h2 className="font-black text-white text-lg">Badges & Accomplissements</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-lg p-4 text-center transition-all ${
                  badge.unlocked
                    ? 'bg-yellow-500/20 border-2 border-yellow-500'
                    : 'bg-gray-800/50 border-2 border-gray-700 opacity-40'
                }`}
              >
                <div className="text-4xl mb-2">{badge.emoji}</div>
                <div className={`text-xs font-black ${badge.unlocked ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {badge.name}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-400">
            {unlockedBadges.length} / {badges.length} badges débloqués
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
            <div className="font-black text-blue-400 mb-2">💡 CONSEIL</div>
            <p className="text-sm text-gray-300">
              Continue comme ça ! La régularité est la clé. Chaque session te rapproche de ton objectif de 18+ de moyenne.
            </p>
          </div>

          {onLogout && (
            <Button
              onClick={onLogout}
              className="w-full bg-yellow-600 text-white hover:bg-yellow-700 font-black"
            >
              Se déconnecter
            </Button>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-950 hover:border-red-500"
          >
            Réinitialiser l'application
          </Button>
        </div>
      </div>
    </div>
  );
};