import { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CoachMessageProps {
  name: string;
  streak: number;
  missedSessions: number;
  nextSession?: { time: string; type: string };
}

export const CoachMessage = ({ name, streak, missedSessions, nextSession }: CoachMessageProps) => {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    generateMessage();
  }, [streak, missedSessions, nextSession]);

  const generateMessage = () => {
    const messages = [];

    // Messages basés sur le streak
    if (streak === 0) {
      messages.push(`${name}, c'est le moment de commencer ! Première session : on donne tout. 💪`);
    } else if (streak >= 30) {
      messages.push(`${streak} jours de streak ! Tu es une MACHINE ! Continue, la médecine t'attend ! 🔥`);
    } else if (streak >= 7) {
      messages.push(`${streak} jours ! Tu prends le rythme. Maintenant on accélère ! ⚡`);
    } else if (streak >= 3) {
      messages.push(`${streak} jours de discipline. Tu commences à comprendre le game. 👊`);
    }

    // Messages sur les sessions ratées
    if (missedSessions === 1) {
      messages.push(`⚠️ 1 session ratée. Encore 2 et ton streak disparaît. FOCUS !`);
    } else if (missedSessions === 2) {
      messages.push(`🚨 ALERTE ROUGE : 2 sessions ratées ! Une de plus = GAME OVER pour ton streak !`);
    }

    // Message sur la prochaine session
    if (nextSession) {
      const emoji = nextSession.type === 'etudes' ? '📚' : nextSession.type === 'muscu' ? '💪' : '🎬';
      messages.push(`${emoji} Prochaine session ${nextSession.type} à ${nextSession.time}. Prépare-toi !`);
    }

    // Messages motivationnels aléatoires
    const motivational = [
      'Chaque session te rapproche de 18+. Pas de compromis.',
      'Ton futur toi te regarde. Tu veux être fier ou avoir des regrets ?',
      'La discipline bat le talent quand le talent n\'a pas de discipline.',
      'Tu veux médecine musclé ? Alors bouge TON CUL !',
      'Les excuses ne construisent pas de carrière en médecine.',
    ];
    
    if (Math.random() > 0.5) {
      messages.push(motivational[Math.floor(Math.random() * motivational.length)]);
    }

    setMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto px-6 mb-6"
      >
        <div className="bg-gradient-to-r from-[#00ff00]/20 to-[#00ff00]/5 border border-[#00ff00]/30 rounded-lg p-4 relative">
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="bg-[#00ff00] rounded-full p-2 mt-1">
              <MessageSquare className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="font-black text-[#00ff00] text-sm mb-1">IA COACH</div>
              <p className="text-white text-sm leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
