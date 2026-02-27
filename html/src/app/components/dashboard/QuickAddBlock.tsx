import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScheduledBlock } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface QuickAddBlockProps {
  onAddBlock: (block: ScheduledBlock) => void;
}

export const QuickAddBlock = ({ onAddBlock }: QuickAddBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [blockData, setBlockData] = useState({
    type: 'lecture' as 'etudes' | 'muscu' | 'course' | 'youtube' | 'lecture' | 'football',
    startTime: '20:00',
    endTime: '20:30',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const blockTypes = [
    { value: 'lecture', label: '📖 Lecture', emoji: '📖' },
    { value: 'etudes', label: '📚 Études', emoji: '📚' },
    { value: 'muscu', label: '💪 Musculation', emoji: '💪' },
    { value: 'football', label: '⚽ Football', emoji: '⚽' },
    { value: 'course', label: '🏃 Course', emoji: '🏃' },
    { value: 'youtube', label: '🎬 YouTube', emoji: '🎬' },
  ];

  const handleAdd = () => {
    if (!blockData.startTime || !blockData.endTime) {
      toast.error('Horaires requis');
      return;
    }

    const block: ScheduledBlock = {
      id: `manual-${Date.now()}`,
      date: blockData.date,
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      type: blockData.type,
      completed: false,
      label: 'Ajouté manuellement',
    };

    onAddBlock(block);
    toast.success(`✅ Bloc ${blockTypes.find(t => t.value === blockData.type)?.emoji} ajouté !`);
    setIsOpen(false);
    
    // Reset form
    setBlockData({
      type: 'lecture',
      startTime: '20:00',
      endTime: '20:30',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 font-black"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une activité
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Ajouter une activité</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-400">Type d'activité</Label>
            <Select 
              value={blockData.type} 
              onValueChange={(val: any) => setBlockData({ ...blockData, type: val })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {blockTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400">Date</Label>
            <Input
              type="date"
              value={blockData.date}
              onChange={(e) => setBlockData({ ...blockData, date: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400">Heure de début</Label>
              <Input
                type="time"
                value={blockData.startTime}
                onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Heure de fin</Label>
              <Input
                type="time"
                value={blockData.endTime}
                onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {blockData.type === 'lecture' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                📖 La lecture développe ton vocabulaire, ta culture et ta capacité d'analyse. 30min/jour minimum recommandé !
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-400"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              className="flex-1 bg-[#00ff00] text-black hover:bg-[#00dd00] font-black"
            >
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
