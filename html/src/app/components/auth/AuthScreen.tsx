import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Zap, Mail, Lock, User, Calendar } from 'lucide-react';
import { signup, signin } from '../../utils/api';
import { toast } from 'sonner';

interface AuthScreenProps {
  onAuthSuccess: (accessToken: string, userData: any) => void;
}

export const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !age) {
      toast.error('Tous les champs sont requis');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({
        email,
        password,
        name,
        age: parseInt(age),
      });

      if (result.error) {
        toast.error('Erreur d\'inscription', {
          description: result.error,
        });
        setIsLoading(false);
        return;
      }

      // After signup, auto sign-in
      const signinResult = await signin({ email, password });
      
      if (signinResult.error || !signinResult.session) {
        toast.error('Inscription réussie ! Connecte-toi maintenant.');
        setMode('signin');
        setIsLoading(false);
        return;
      }

      toast.success('Bienvenue ! 🔥');
      onAuthSuccess(signinResult.session.access_token, signinResult.session.user);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email et mot de passe requis');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signin({ email, password });

      if (result.error || !result.session) {
        toast.error('Erreur de connexion', {
          description: result.error || 'Identifiants invalides',
        });
        setIsLoading(false);
        return;
      }

      toast.success('Connexion réussie ! 💪');
      onAuthSuccess(result.session.access_token, result.session.user);
    } catch (error) {
      console.error('Signin error:', error);
      toast.error('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#00ff00]/20 p-6 rounded-full mb-4">
            <Zap className="w-16 h-16 text-[#00ff00]" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">APEX COACH</h1>
          <p className="text-gray-400">
            Transforme-toi en étudiant d'excellence avec un physique d'athlète
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-8">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('signin')}
              className={`py-2 rounded-md font-black transition-all ${
                mode === 'signin'
                  ? 'bg-[#00ff00] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CONNEXION
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`py-2 rounded-md font-black transition-all ${
                mode === 'signup'
                  ? 'bg-[#00ff00] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              INSCRIPTION
            </button>
          </div>

          <form onSubmit={mode === 'signin' ? handleSignin : handleSignup} className="space-y-4">
            {/* Signup only fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom complet
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Thomas Dupont"
                    className="bg-gray-800 border-gray-700 text-white"
                    required={mode === 'signup'}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Âge
                  </label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 17"
                    min="14"
                    max="25"
                    className="bg-gray-800 border-gray-700 text-white"
                    required={mode === 'signup'}
                  />
                </div>
              </>
            )}

            {/* Common fields */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton.email@exemple.com"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-gray-800 border-gray-700 text-white"
                required
                minLength={6}
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] font-black h-12 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {mode === 'signin' ? 'Connexion...' : 'Inscription...'}
                </div>
              ) : (
                <>{mode === 'signin' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}</>
              )}
            </Button>
          </form>

          {/* Info message */}
          <div className="mt-6 p-4 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg">
            <p className="text-xs text-gray-300 text-center">
              {mode === 'signin' 
                ? '🔐 Tes données sont sécurisées et synchronisées dans le cloud'
                : '✨ Crée ton compte pour sauvegarder ta progression et y accéder partout'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>APEX Coach • Discipline militaire • Résultats garantis</p>
        </div>
      </div>
    </div>
  );
};
