import { useState } from 'react';
import { format, parse } from 'date-fns';
import { ScheduledBlock } from '../../types';
import { CheckCircle2, Circle, XCircle, Camera, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

interface TimelineProps {
  date: string;
  blocks: ScheduledBlock[];
  onBlockComplete: (blockId: string, photo?: string) => void;
  onBlockMissed: (blockId: string, reason: string) => void;
}

export const Timeline = ({ date, blocks, onBlockComplete, onBlockMissed }: TimelineProps) => {
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const todayBlocks = blocks.filter(block => block.date === date).sort((a, b) => {
    const timeA = parse(a.startTime, 'HH:mm', new Date());
    const timeB = parse(b.startTime, 'HH:mm', new Date());
    return timeA.getTime() - timeB.getTime();
  });

  const getBlockColor = (block: ScheduledBlock) => {
    if (block.completed) return 'bg-[#00ff00]/20 border-[#00ff00]';
    
    const now = new Date();
    const blockStart = parse(block.startTime, 'HH:mm', new Date());
    const blockEnd = parse(block.endTime, 'HH:mm', new Date());
    
    if (now > blockEnd && !block.completed) return 'bg-red-500/20 border-red-500';
    if (now >= blockStart && now <= blockEnd) return 'bg-orange-500/20 border-orange-500';
    
    return 'bg-gray-800/50 border-gray-700';
  };

  const getBlockIcon = (block: ScheduledBlock) => {
    if (block.completed) return <CheckCircle2 className="w-5 h-5 text-[#00ff00]" />;
    
    const now = new Date();
    const blockEnd = parse(block.endTime, 'HH:mm', new Date());
    
    if (now > blockEnd && !block.completed) return <XCircle className="w-5 h-5 text-red-500" />;
    return <Circle className="w-5 h-5 text-gray-500" />;
  };

  const getBlockEmoji = (type: string) => {
    switch (type) {
      case 'etudes': return '📚';
      case 'muscu': return '💪';
      case 'course': return '🏃';
      case 'youtube': return '🎬';
      case 'lecture': return '📖';
      case 'football': return '⚽';
      default: return '⚡';
    }
  };

  const getBlockLabel = (type: string) => {
    switch (type) {
      case 'etudes': return 'Session Études';
      case 'muscu': return 'Musculation';
      case 'course': return 'Course à pied';
      case 'youtube': return 'Création YouTube';
      case 'lecture': return 'Lecture';
      case 'football': return 'Football';
      default: return 'Activité';
    }
  };

  const handleCheckIn = (block: ScheduledBlock) => {
    setSelectedBlock(block);
    setCheckInOpen(true);
  };

  const completeBlock = () => {
    if (selectedBlock) {
      onBlockComplete(selectedBlock.id, 'photo-placeholder');
      setCheckInOpen(false);
      toast.success('💪 Session validée !', {
        description: 'Ton streak continue. Continue comme ça !',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#00ff00]" />
        Timeline du jour
      </h2>

      {todayBlocks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune session planifiée aujourd'hui. Profite de ton repos !
        </div>
      ) : (
        <div className="space-y-3">
          {todayBlocks.map((block) => (
            <div
              key={block.id}
              className={`border rounded-lg p-4 transition-all ${getBlockColor(block)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getBlockIcon(block)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getBlockEmoji(block.type)}</span>
                      <span className="font-black text-white">{getBlockLabel(block.type)}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {block.startTime} - {block.endTime}
                    </div>
                  </div>
                </div>
                
                {!block.completed && (
                  <Button
                    onClick={() => handleCheckIn(block)}
                    className="bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Check-in
                  </Button>
                )}
                
                {block.completed && (
                  <div className="flex items-center gap-2 text-[#00ff00] font-black">
                    <CheckCircle2 className="w-5 h-5" />
                    Complété
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-in Dialog */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#00ff00]">
              Valider la session
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                En production, tu prendrais une photo de ton bureau/exercice pour prouver que tu as fait la session.
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
              <p className="text-sm text-yellow-500">
                ⚡ Valide uniquement si tu as VRAIMENT fait la session. Pas de triche !
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setCheckInOpen(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300"
              >
                Annuler
              </Button>
              <Button
                onClick={completeBlock}
                className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
              >
                Valider la session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};