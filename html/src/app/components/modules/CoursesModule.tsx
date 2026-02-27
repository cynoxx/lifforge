import { useState } from 'react';
import { GraduationCap, Plus, TrendingUp, Award, BookOpen, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AppState, Grade } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CoursesModuleProps {
  state: AppState;
  onUpdateGrades: (grades: Grade[]) => void;
  onUpdateAverage: (average: number) => void;
}

export const CoursesModule = ({ state, onUpdateGrades, onUpdateAverage }: CoursesModuleProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: '',
    coefficient: '1',
    label: '',
  });

  const grades = state.userProfile?.grades || [];

  const subjects = [
    'Mathématiques',
    'Physique-Chimie',
    'SVT',
    'Français',
    'Philosophie',
    'Histoire-Géo',
    'Anglais',
    'Espagnol',
    'Allemand',
    'EPS',
    'Spécialité 1',
    'Spécialité 2',
    'Grand Oral',
    'Autre',
  ];

  const calculateAverage = (gradesList: Grade[]) => {
    if (gradesList.length === 0) return state.userProfile?.currentAverage || 0;
    
    let totalPoints = 0;
    let totalCoefficients = 0;

    gradesList.forEach(g => {
      totalPoints += g.grade * g.coefficient;
      totalCoefficients += g.coefficient;
    });

    return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
  };

  const handleAddGrade = () => {
    if (!newGrade.subject || !newGrade.grade) {
      toast.error('Matière et note requises');
      return;
    }

    const gradeValue = parseFloat(newGrade.grade);
    const coeffValue = parseFloat(newGrade.coefficient);

    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast.error('Note invalide (0-20)');
      return;
    }

    if (isNaN(coeffValue) || coeffValue <= 0) {
      toast.error('Coefficient invalide');
      return;
    }

    const grade: Grade = {
      id: Date.now().toString(),
      subject: newGrade.subject,
      grade: gradeValue,
      coefficient: coeffValue,
      date: new Date().toISOString().split('T')[0],
      label: newGrade.label || undefined,
    };

    const updatedGrades = [...grades, grade];
    onUpdateGrades(updatedGrades);

    const newAverage = calculateAverage(updatedGrades);
    onUpdateAverage(newAverage);

    toast.success(`✅ Note ajoutée ! Nouvelle moyenne : ${newAverage.toFixed(2)}/20`);

    setNewGrade({ subject: '', grade: '', coefficient: '1', label: '' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteGrade = (gradeId: string) => {
    const updatedGrades = grades.filter(g => g.id !== gradeId);
    onUpdateGrades(updatedGrades);

    const newAverage = calculateAverage(updatedGrades);
    onUpdateAverage(newAverage);

    toast.success(`Note supprimée. Nouvelle moyenne : ${newAverage.toFixed(2)}/20`);
  };

  const currentAverage = calculateAverage(grades);
  const targetAverage = state.userProfile?.targetAverage || 18;
  const progressPercentage = (currentAverage / targetAverage) * 100;

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <GraduationCap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">COURS & NOTES</h1>
              <p className="text-gray-400">Suis ta moyenne et tes évaluations</p>
            </div>
          </div>
        </div>

        {/* Average Card */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Moyenne générale</div>
              <div className="text-5xl font-black text-white">{currentAverage.toFixed(2)}</div>
              <div className="text-sm text-gray-400 mt-1">/ 20</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Objectif</div>
              <div className="text-3xl font-black text-[#00ff00]">{targetAverage}</div>
              <div className="text-sm text-gray-400 mt-1">/ 20</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progression vers l'objectif</span>
              <span className="font-black text-[#00ff00]">{Math.min(100, progressPercentage).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-[#00ff00] h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {currentAverage >= targetAverage ? (
              <div className="flex items-center gap-2 text-[#00ff00]">
                <Award className="w-5 h-5" />
                <span className="font-black">🎯 OBJECTIF ATTEINT !</span>
              </div>
            ) : (
              <div className="text-gray-400">
                <span className="font-bold">{(targetAverage - currentAverage).toFixed(2)} points</span> pour atteindre ton objectif
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-black text-blue-400">{grades.length}</div>
            <div className="text-xs text-gray-400 mt-1">Notes enregistrées</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-black text-green-400">{Object.keys(gradesBySubject).length}</div>
            <div className="text-xs text-gray-400 mt-1">Matières</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-black text-purple-400">
              {grades.length > 0 ? Math.max(...grades.map(g => g.grade)).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Meilleure note</div>
          </div>
        </div>

        {/* Add Grade Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] font-black mb-6">
              <Plus className="w-5 h-5 mr-2" />
              AJOUTER UNE NOTE
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nouvelle note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-400">Matière *</Label>
                <Select value={newGrade.subject} onValueChange={(val) => setNewGrade({ ...newGrade, subject: val })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Choisis une matière" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-400">Note (sur 20) *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  value={newGrade.grade}
                  onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                  placeholder="Ex: 15.5"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400">Coefficient</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newGrade.coefficient}
                  onChange={(e) => setNewGrade({ ...newGrade, coefficient: e.target.value })}
                  placeholder="Ex: 2"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400">Type d'évaluation (optionnel)</Label>
                <Input
                  type="text"
                  value={newGrade.label}
                  onChange={(e) => setNewGrade({ ...newGrade, label: e.target.value })}
                  placeholder="Ex: DS, DM, Contrôle continu..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddDialogOpen(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-400"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddGrade}
                  className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Grades List */}
        {grades.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="font-black text-xl text-gray-600 mb-2">Aucune note enregistrée</h3>
            <p className="text-gray-500 text-sm">
              Ajoute tes notes pour suivre ta moyenne en temps réel
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-black text-xl text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-400" />
              Historique des notes
            </h2>

            {Object.entries(gradesBySubject)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([subject, subjectGrades]) => {
                const subjectAverage = calculateAverage(subjectGrades);
                return (
                  <div key={subject} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-lg text-white">{subject}</h3>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Moyenne</div>
                        <div className="text-xl font-black text-blue-400">{subjectAverage.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {subjectGrades
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((grade) => (
                          <div
                            key={grade.id}
                            className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${
                                  grade.grade >= 16 ? 'text-[#00ff00]' :
                                  grade.grade >= 12 ? 'text-blue-400' :
                                  grade.grade >= 10 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {grade.grade.toFixed(2)}
                                </span>
                                <span className="text-gray-500">/20</span>
                                {grade.label && (
                                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">
                                    {grade.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Coef {grade.coefficient} • {format(new Date(grade.date), 'dd MMM yyyy', { locale: fr })}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteGrade(grade.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Tips */}
        {grades.length > 0 && currentAverage < targetAverage && (
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-black text-blue-400 mb-1">💡 CONSEIL</h3>
                <p className="text-sm text-gray-300">
                  Pour atteindre {targetAverage}/20, tu dois viser minimum <span className="font-black text-[#00ff00]">{(targetAverage + 1).toFixed(0)}/20</span> à tes prochaines évals. Concentre-toi sur tes études quotidiennes !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
