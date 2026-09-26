import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '143090887615-nbhj2ua2f9k2fr5q9nso363ksmqle0hd.apps.googleusercontent.com';

export const GoogleAuthButton = ({ isActionLoading }) => {
  const { loginWithGoogle, setError } = useAuth();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              await loginWithGoogle(response.credential);
            } else {
              setError('Failed to receive Google authentication credential.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      // If script is still loading asynchronously
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleSignIn();
        }
      }, 100);

      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [loginWithGoogle, setError]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
      <div
        ref={googleBtnRef}
        id="googleSignInDiv"
        style={{
          minHeight: '44px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          opacity: isActionLoading ? 0.6 : 1,
          pointerEvents: isActionLoading ? 'none' : 'auto',
        }}
      />
    </div>
  );
};
