// Google Identity Services (GIS) helper
// Documentação: https://developers.google.com/identity/gsi/web/guides/overview

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export interface CredentialResponse {
  credential: string;
  select_by: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface GoogleUser {
  access_token: string;
  expires_at: number;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient: { requestAccessToken: () => void } | null = null;

export function initializeGoogleAuth(callback: (user: GoogleUser | null) => void): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID não configurado');
    return;
  }

  // Carregar o script do Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    if (window.google?.accounts?.oauth2) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: TokenResponse) => {
          if (response.access_token) {
            const user: GoogleUser = {
              access_token: response.access_token,
              expires_at: Date.now() + response.expires_in * 1000,
            };
            localStorage.setItem('drivetune_user', JSON.stringify(user));
            callback(user);
          } else {
            callback(null);
          }
        },
      });
    }
  };
}

export function signIn(): void {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

export function signOut(): void {
  localStorage.removeItem('drivetune_user');
  // Recarregar para limpar o estado do Google
  window.location.reload();
}

export function getStoredUser(): GoogleUser | null {
  const stored = localStorage.getItem('drivetune_user');
  if (!stored) return null;

  try {
    const user: GoogleUser = JSON.parse(stored);
    // Verificar se o token ainda é válido
    if (user.expires_at > Date.now()) {
      return user;
    }
    // Token expirado, remover
    localStorage.removeItem('drivetune_user');
    return null;
  } catch {
    localStorage.removeItem('drivetune_user');
    return null;
  }
}

export function getAccessToken(): string | null {
  const user = getStoredUser();
  return user?.access_token ?? null;
}
