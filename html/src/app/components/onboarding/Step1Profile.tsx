import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Target, TrendingUp } from 'lucide-react';

interface Step1ProfileProps {
  onNext: (data: { name: string; age: number; currentAverage: number; targetAverage: number }) => void;
}

export const Step1Profile = ({ onNext }: Step1ProfileProps) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [currentAverage, setCurrentAverage] = useState('15.5');
  const [targetAverage, setTargetAverage] = useState('18');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && age && currentAverage && targetAverage) {
      onNext({
        name,
        age: parseInt(age),
        currentAverage: parseFloat(currentAverage),
        targetAverage: parseFloat(targetAverage),
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00ff00]/20 mb-4">
            <Target className="w-10 h-10 text-[#00ff00]" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            APEX COACH
          </h1>
          <p className="text-gray-400">
            Transformation totale. Discipline militaire. Résultats garantis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300 mb-2 block">
                Ton prénom
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white focus:border-[#00ff00] focus:ring-[#00ff00]"
                placeholder="Alex"
                required
              />
            </div>

            <div>
              <Label htmlFor="age" className="text-gray-300 mb-2 block">
                Âge
              </Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white focus:border-[#00ff00] focus:ring-[#00ff00]"
                placeholder="17"
                min="15"
                max="19"
                required
              />
            </div>

            <div>
              <Label htmlFor="current" className="text-gray-300 mb-2 block">
                Moyenne actuelle (S1)
              </Label>
              <Input
                id="current"
                type="number"
                step="0.1"
                value={currentAverage}
                onChange={(e) => setCurrentAverage(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white focus:border-[#00ff00] focus:ring-[#00ff00]"
                placeholder="15.5"
                min="10"
                max="20"
                required
              />
            </div>

            <div>
              <Label htmlFor="target" className="text-gray-300 mb-2 block flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00ff00]" />
                Objectif (S2)
              </Label>
              <Input
                id="target"
                type="number"
                step="0.1"
                value={targetAverage}
                onChange={(e) => setTargetAverage(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white focus:border-[#00ff00] focus:ring-[#00ff00]"
                placeholder="18.0"
                min="15"
                max="20"
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] font-black text-lg h-14"
          >
            COMMENCER LA TRANSFORMATION
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Engagement total requis. Pas de compromis.
        </div>
      </div>
    </div>
  );
};
