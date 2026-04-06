import { useState, useEffect } from 'react';
import './Login.css';
import './auth.css';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider.jsx';
import GoogleAuthButton from './GoogleAuthButton';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, isProcessing, isAuthenticated, isAdmin, isDelivery, loginError, googleError } = useAuth();

    const from = location.state?.from || '/';

    useEffect(() => {
        if (isAuthenticated) {
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else if (isDelivery) {
                navigate('/delivery/dashboard');
            } else {
                navigate(from);
            }
        }
    }, [isAuthenticated, isAdmin, isDelivery, navigate, from]);



    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.email.trim() || !formData.password.trim()) {
            setFormError('Please fill in all fields.');
            return;
        }

        login(formData);
    };
    const getIcon = (name) => {
        const Icon = Lucide[name] || Lucide['Circle'];
        return <Icon size={18} />;
    };

    const displayError = formError || loginError || googleError;

    return (
        <div className="auth-full-page">
            <header className="auth-simple-header">
                <Link to="/" className="auth-logo">
                    <img src="/eco.svg" alt="B-Mart" />
                    <span>B-Mart</span>
                </Link>
            </header>

            <main className="auth-content">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Enter your details to access your B-Mart account.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                {getIcon('Mail')}
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="label-flex">
                                <label>Password</label>
                            </div>
                            <div className="input-wrapper">
                                {getIcon('Lock')}
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <div
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {getIcon(showPassword ? 'EyeOff' : 'Eye')}
                                </div>
                            </div>
                        </div>

                        {displayError && (
                            <p className="auth-inline-error">★ {displayError}</p>
                        )}

                        <button type="submit" className="auth-submit-btn" disabled={isProcessing}>
                            {isProcessing ? "Signing In..." : "Sign In"}
                        </button>

                        <div className="auth-divider"><span>Or continue with</span></div>

                        <GoogleAuthButton actionText="signin_with" />

                        <p className="auth-footer">
                            New to B-Mart? <Link to="/register" state={{ from: location.state?.from }}>Create an account</Link>
                        </p>
                    </form>
                </div>
            </main>

            <footer className="auth-simple-footer">
                <div className="auth-footer-links">
                    <a href="#">Conditions of Use</a>
                    <a href="#">Privacy Notice</a>
                    <a href="#">Help</a>
                </div>
                <p>© 2026, B-Mart.com, Inc. or its affiliates</p>
            </footer>
        </div>
    );
};

export default Login;