import { useEffect, useState } from 'react';
import { Step1Profile } from './components/onboarding/Step1Profile';
import { Step2Schedule } from './components/onboarding/Step2Schedule';
import { Step3Contract } from './components/onboarding/Step3Contract';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppState, UserProfile, WeeklySchedule } from './types';
import { loadState, saveState, resetState } from './utils/storage';
import { generateWeeklyBlocks } from './utils/scheduler';
import { getUserData, saveUserData, getSession, signout } from './utils/api';
import { supabase } from './utils/supabase-client';
import { Toaster } from './components/ui/sonner';
import { addDays } from 'date-fns';
import { toast } from 'sonner';

function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [tempSchedule, setTempSchedule] = useState<WeeklySchedule | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setIsAuthenticated(true);
        await loadUserData(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auto-save user data to backend when state changes
  useEffect(() => {
    if (isAuthenticated && accessToken && state.onboardingComplete) {
      saveState(state);
      // Debounce save to backend
      const timer = setTimeout(() => {
        saveUserDataToBackend(accessToken, state);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      saveState(state);
    }
  }, [state, isAuthenticated, accessToken]);

  const loadUserData = async (token: string) => {
    try {
      const result = await getUserData(token);
      if (result.error) {
        console.error('Failed to load user data:', result.error);
        // Don't show error toast on initial load if no data exists
        if (result.error !== 'Failed to get data') {
          toast.error('Erreur de chargement des données');
        }
        return;
      }

      if (result.data) {
        setState(result.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserDataToBackend = async (token: string, data: AppState) => {
    try {
      const result = await saveUserData(token, data);
      if (result.error) {
        console.error('Failed to save user data:', result.error);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleAuthSuccess = async (token: string, userData: any) => {
    setAccessToken(token);
    setIsAuthenticated(true);
    
    // Load user data from backend
    setIsLoadingData(true);
    await loadUserData(token);
    setIsLoadingData(false);
  };

  const handleLogout = async () => {
    await signout();
    setIsAuthenticated(false);
    setAccessToken(null);
    setState(loadState());
    toast.success('Déconnecté');
  };

  const handleProfileComplete = (data: { 
    name: string; 
    age: number; 
    currentAverage: number; 
    targetAverage: number 
  }) => {
    const profile: UserProfile = {
      ...data,
      startDate: new Date().toISOString().split('T')[0],
    };
    setTempProfile(profile);
    setOnboardingStep(2);
  };

  const handleScheduleComplete = (schedule: WeeklySchedule) => {
    setTempSchedule(schedule);
    setOnboardingStep(3);
  };

  const handleContractComplete = () => {
    if (tempProfile && tempSchedule) {
      // Générer les blocs pour les 7 prochains jours
      const blocks = generateWeeklyBlocks(tempSchedule, new Date());
      
      setState({
        ...state,
        onboardingComplete: true,
        userProfile: tempProfile,
        weeklySchedule: tempSchedule,
        scheduledBlocks: blocks,
        streak: 0,
        missedSessions: 0,
      });
    }
  };

  const handleUpdateState = (updates: Partial<AppState>) => {
    setState({ ...state, ...updates });
  };

  const handleReset = () => {
    if (confirm('Es-tu sûr de vouloir réinitialiser toute l\'application ? Toutes tes données seront perdues.')) {
      resetState();
      handleLogout();
      window.location.reload();
    }
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <Toaster 
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: '#111',
              border: '1px solid #333',
              color: '#fff',
            },
          }}
        />
      </>
    );
  }

  // Loading user data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00ff00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-black text-xl">Chargement de tes données...</p>
        </div>
      </div>
    );
  }

  // Si l'onboarding n'est pas complété
  if (!state.onboardingComplete) {
    if (onboardingStep === 1) {
      return <Step1Profile onNext={handleProfileComplete} />;
    }
    
    if (onboardingStep === 2) {
      return (
        <Step2Schedule
          onNext={handleScheduleComplete}
          onBack={() => setOnboardingStep(1)}
        />
      );
    }
    
    if (onboardingStep === 3 && tempProfile) {
      return (
        <Step3Contract
          name={tempProfile.name}
          onComplete={handleContractComplete}
          onBack={() => setOnboardingStep(2)}
        />
      );
    }
  }

  // Dashboard principal
  return (
    <>
      <Dashboard 
        state={state} 
        onUpdateState={handleUpdateState}
        onReset={handleReset}
        onLogout={handleLogout}
      />
      <Toaster 
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: '#111',
            border: '1px solid #333',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;