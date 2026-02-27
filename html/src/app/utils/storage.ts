import { AppState } from '../types';

const STORAGE_KEY = 'apex_coach_data';

const DEFAULT_STATE: AppState = {
  onboardingComplete: false,
  scheduledBlocks: [],
  streak: 0,
  missedSessions: 0,
  progressPhotos: [],
  studySessions: [],
  workoutSessions: [],
};

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return DEFAULT_STATE;
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

export const resetState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
