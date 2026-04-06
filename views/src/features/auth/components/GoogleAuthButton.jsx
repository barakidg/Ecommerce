import { useEffect, useRef } from 'react';
import { useAuth } from '../AuthProvider.jsx';

const GoogleAuthButton = ({ actionText = "signin_with" }) => {
    const { googleLogin, isProcessing, isAuthenticated } = useAuth();
    const googleBtnRef = useRef(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (isAuthenticated) return undefined;

        let cancelled = false;
        let pollId;

        const setup = () => {
            if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current || initialized.current) return false;
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) return false;

            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    googleLogin(response.credential);
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });

            googleBtnRef.current.innerHTML = '';
            google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: actionText
            });

            google.accounts.id.prompt((notification) => {
                if (notification?.isNotDisplayed?.() && import.meta.env.DEV) {
                    const r = notification.getNotDisplayedReason?.();
                    if (r) console.debug('[Google One Tap]', r);
                }
            });

            initialized.current = true;
            return true;
        };

        if (setup()) {
        } else {
            pollId = window.setInterval(() => {
                if (setup()) {
                    window.clearInterval(pollId);
                    pollId = null;
                }
            }, 100);
            window.setTimeout(() => {
                if (pollId) window.clearInterval(pollId);
            }, 20000);
        }

        return () => {
            cancelled = true;
            if (pollId) window.clearInterval(pollId);
            initialized.current = false;
            window.google?.accounts?.id?.cancel();
        };
    }, [googleLogin, actionText, isAuthenticated]);

    return (
        <div style={{ width: '100%', opacity: isProcessing ? 0.6 : 1, pointerEvents: isProcessing ? 'none' : 'auto' }}>
            <div ref={googleBtnRef} className="google-btn-container" style={{ display: 'flex', justifyContent: 'center' }} />
        </div>
    );
};

export default GoogleAuthButton;
