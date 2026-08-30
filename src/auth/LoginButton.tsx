import { useState, useEffect } from 'react';
import {
  initializeGoogleAuth,
  signIn,
  signOut,
  getStoredUser,
} from './google-auth';
import type { GoogleUser } from './google-auth';

interface LoginButtonProps {
  onAuthChange: (user: GoogleUser | null) => void;
}

export function LoginButton({ onAuthChange }: LoginButtonProps) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo
    const storedUser = getStoredUser();
    setUser(storedUser);
    onAuthChange(storedUser);
    setLoading(false);

    // Inicializar Google Auth
    initializeGoogleAuth((newUser) => {
      setUser(newUser);
      onAuthChange(newUser);
    });
  }, [onAuthChange]);

  const handleSignIn = () => {
    signIn();
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    onAuthChange(null);
  };

  if (loading) {
    return <button disabled>Carregando...</button>;
  }

  if (user) {
    return (
      <button onClick={handleSignOut} className="login-button logout">
        Sair da Conta Google
      </button>
    );
  }

  return (
    <button onClick={handleSignIn} className="login-button">
      Entrar com Google
    </button>
  );
}
