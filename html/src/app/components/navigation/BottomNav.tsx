import { Home, BookOpen, Dumbbell, Calendar, User, GraduationCap } from 'lucide-react';

interface BottomNavProps {
  currentView: 'dashboard' | 'studies' | 'sport' | 'courses' | 'calendar' | 'profile';
  onViewChange: (view: 'dashboard' | 'studies' | 'sport' | 'courses' | 'calendar' | 'profile') => void;
}

export const BottomNav = ({ currentView, onViewChange }: BottomNavProps) => {
  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Home' },
    { id: 'courses' as const, icon: GraduationCap, label: 'Cours' },
    { id: 'studies' as const, icon: BookOpen, label: 'Études' },
    { id: 'sport' as const, icon: Dumbbell, label: 'Sport' },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-[#00ff00]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-black">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};