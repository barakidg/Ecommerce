import { useState, useEffect } from 'react';
import './Register.css';
import './auth.css';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider.jsx';
import GoogleAuthButton from './GoogleAuthButton';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { register, isProcessing, isAuthenticated, isAdmin, registerError, googleError } = useAuth();

    const from = location.state?.from || '/';

    useEffect(() => {
        if (isAuthenticated) {
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate(from);
            }
        }
    }, [isAuthenticated, isAdmin, navigate, from]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);

        const { name, email, password, confirm_password } = formData;

        if (!name.trim() || !email.trim() || !password.trim() || !confirm_password.trim()) {
            setFormError('Please fill in all fields.');
            return;
        }

        if (password.length < 4) {
            setFormError('Password must be at least 4 characters.');
            return;
        }

        if (password !== confirm_password) {
            setFormError('Passwords do not match.');
            return;
        }

        register(formData);
    };

    const getIcon = (name, size = 18) => {
        const Icon = Lucide[name] || Lucide['Circle'];
        return <Icon size={size} />;
    };

    const displayError = formError || registerError || googleError;

    return (
        <div className="auth-full-page">
            <header className="auth-simple-header">
                <Link to="/" className="auth-logo">
                    <img src="/eco.svg" alt="B-Mart" />
                    <span>B-Mart</span>
                </Link>
            </header>

            <main className="auth-content">
                <div className="register-container">
                    <div className="auth-banner">
                        <div className="banner-overlay">
                            <div className="banner-content">
                                <h1>Join the Future of <br />Shopping in Ethiopia.</h1>
                                <p>Create an account to track orders and get exclusive deal notifications.</p>
                                <div className="banner-features">
                                    <div className="feat-item">{getIcon('ShieldCheck')} <span>Secure Checkout</span></div>
                                    <div className="feat-item">{getIcon('Truck')} <span>Fast Delivery</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="auth-form-section">
                        <div className="form-header">
                            <h2>Create Account</h2>
                            <p>Already have an account? <Link to="/login" state={{ from: location.state?.from }}>Login here</Link></p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    {getIcon('User')}
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Bereket Degfew"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

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
                                <label>Password</label>
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
                                        className="password-toggle password-toggle-register"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {getIcon(showPassword ? 'EyeOff' : 'Eye')}
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    {getIcon('Lock')}
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        placeholder="confirm password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                    />
                                    <div
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {getIcon(showConfirmPassword ? 'EyeOff' : 'Eye')}
                                    </div>
                                </div>
                            </div>

                            {displayError && (
                                <p className="auth-inline-error">★ {displayError}</p>
                            )}

                            <button type="submit" className="auth-submit-btn" disabled={isProcessing}>
                                {isProcessing ? "Creating Account..." : "Create Account"}
                            </button>

                            <div className="auth-divider"><span>Or sign up with</span></div>

                            <GoogleAuthButton actionText="signup_with" />
                        </form>
                    </div>
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

export default Register;