import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Shield, Zap } from 'lucide-react';

interface Step3ContractProps {
  name: string;
  onComplete: () => void;
  onBack: () => void;
}

export const Step3Contract = ({ name, onComplete, onBack }: Step3ContractProps) => {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');

  const handleComplete = () => {
    if (agreed && signature) {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00ff00]/20 mb-4">
            <Shield className="w-10 h-10 text-[#00ff00]" />
          </div>
          <h1 className="text-3xl font-black text-[#00ff00] mb-2">
            COMMITMENT CONTRACT
          </h1>
          <p className="text-gray-400">
            Discipline absolue. Accountability totale. Pas d'excuses.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6 border-2 border-[#00ff00]/30">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                RÈGLES D'ENGAGEMENT
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-[#00ff00] font-black">1.</span>
                  <span>Je m'engage à suivre mon planning quotidien avec discipline militaire.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#00ff00] font-black">2.</span>
                  <span>Je validerai chaque session par un check-in photo obligatoire.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#00ff00] font-black">3.</span>
                  <span>Si je rate 3 sessions d'affilée, je perds mon streak et redémarre à 0.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#00ff00] font-black">4.</span>
                  <span>Mes apps seront bloquées pendant les blocs d'étude (mode focus).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#00ff00] font-black">5.</span>
                  <span>Je vise 18+ de moyenne et un physique musclé en 6 mois.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00ff00]" />
                PÉNALITÉS & RÉCOMPENSES
              </h2>
              
              <div className="space-y-4">
                <div className="bg-red-950/50 border border-red-900 rounded-lg p-4">
                  <div className="font-black text-red-500 mb-2">❌ PÉNALITÉS</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Session ratée → Compteur +1</li>
                    <li>• 3 sessions ratées → Streak perdu, redémarrage à 0</li>
                    <li>• Mode "Prison" 24h : Apps bloquées + rappels intenses</li>
                  </ul>
                </div>

                <div className="bg-green-950/50 border border-green-900 rounded-lg p-4">
                  <div className="font-black text-[#00ff00] mb-2">✅ RÉCOMPENSES</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Streak 7 jours → Badge "Warrior"</li>
                    <li>• Streak 30 jours → Badge "Champion"</li>
                    <li>• Streak 90 jours → Badge "APEX Legend"</li>
                    <li>• Objectif atteint → Fierté éternelle 🏆</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1 border-gray-700 data-[state=checked]:bg-[#00ff00] data-[state=checked]:border-[#00ff00]"
            />
            <label htmlFor="agree" className="text-gray-300 text-sm cursor-pointer">
              J'ai lu et j'accepte ce contrat d'engagement. Je comprends que la discipline est non négociable 
              et que je serai tenu responsable de mes actions. Je m'engage à donner 100% chaque jour.
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">
              Signature électronique (tape ton nom complet)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder={`Ex: ${name}`}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
          >
            Retour
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!agreed || !signature}
            className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SIGNER ET COMMENCER
          </Button>
        </div>

        <div className="text-center mt-6 text-xs text-gray-600">
          Date: {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
};
