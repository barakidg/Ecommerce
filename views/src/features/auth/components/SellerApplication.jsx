import React, { useState } from 'react';
import './SellerApplication.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthProvider.jsx';
import { useSellerApplication } from '../hooks/useSellerApplication';
import {
    ChevronRight,
    Store,
    CreditCard,
    FileText,
    CheckCircle2,
    UploadCloud,
    User,
    ArrowLeft
} from 'lucide-react';

const SellerApplication = () => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const { apply, isApplying } = useSellerApplication();

    const [formData, setFormData] = useState({
        businessName: '',
        taxId: '',
        paymentMethod: 'Telebirr',
        accountNumber: '',
        accountHolder: '',
        bankName: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        apply(formData);
    };

    const steps = [
        { id: 1, label: 'Business Info', icon: <Store size={18} /> },
        { id: 2, label: 'Payment Details', icon: <CreditCard size={18} /> },
        { id: 3, label: 'Documents', icon: <FileText size={18} /> }
    ];

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="seller-app-page">
            <header className="auth-simple-header">
                <div className="header-inner">
                    <Link to="/" className="auth-logo">
                        <img src="/eco.svg" alt="B-Mart" />
                        <span>B-Mart</span>
                    </Link>
                    <div className="header-profile">
                        <span className="profile-name">{user?.name || "Guest"}</span>
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" className="profile-avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        ) : (
                            <div className="profile-avatar"><User size={20} /></div>
                        )}
                    </div>
                </div>
            </header>

            <main className="seller-app-container">
                <div className="app-card">
                    <div className="app-header">
                        <h1>Become a B-Mart Seller</h1>
                        <p>Fill in the details below to start your business journey.</p>
                    </div>

                    <div className="stepper-container">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.id}>
                                <div className={`step-item ${step >= s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                                    <div className="step-dot">
                                        {step > s.id ? <CheckCircle2 size={20} /> : s.icon}
                                    </div>
                                    <span className="step-label">{s.label}</span>
                                </div>
                                {index < steps.length - 1 && <div className={`step-line ${step > s.id ? 'active' : ''}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="step-content">
                        {step === 1 && (
                            <div className="form-fade-in">
                                <h3>Business Information</h3>
                                <div className="input-grid">
                                    <div className="input-group">
                                        <label>Shop Name</label>
                                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="e.g. Bereket Tech Store" />
                                    </div>
                                    <div className="input-group">
                                        <label>Bank Name</label>
                                        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. CBE Bank" />
                                    </div>
                                    <div className="input-group full">
                                        <label>Tax ID / TIN Number</label>
                                        <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} placeholder="Your assigned Tax ID..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', color: '#1a202c', backgroundColor: '#f8fafc', transition: 'all 0.2s', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-fade-in">
                                <h3>Payment & Payouts</h3>
                                <p className="step-desc">Where should we send your earnings?</p>
                                <div className="input-grid">
                                    <div className="input-group">
                                        <label>Preferred Method</label>
                                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                                            <option value="Telebirr">Telebirr</option>
                                            <option value="CBE Bank">CBE Bank</option>
                                            <option value="Dashen Bank">Dashen Bank</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Account Number / Phone</label>
                                        <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="09..." />
                                    </div>
                                    <div className="input-group full">
                                        <label>Account Holder Name</label>
                                        <input type="text" name="accountHolder" value={formData.accountHolder} onChange={handleChange} placeholder="Full Name on Account" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', color: '#1a202c', backgroundColor: '#f8fafc', transition: 'all 0.2s', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-fade-in">
                                <h3>Identity Verification</h3>
                                <div className="upload-area">
                                    <UploadCloud size={48} color="#ff9900" />
                                    <h4>Upload ID or Business License</h4>
                                    <p>Drag and drop or click to browse (PDF, PNG, JPG)</p>
                                    <input type="file" id="file-upload" hidden />
                                    <label htmlFor="file-upload" className="upload-btn">Select File</label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="app-footer-actions">
                        {step > 1 && (
                            <button className="btn-secondary" onClick={prevStep}>
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}
                        <button className="btn-primary" onClick={step === 3 ? handleSubmit : nextStep} disabled={isApplying}>
                            {step === 3 ? (isApplying ? 'Submitting...' : 'Submit Application') : <>Next Step <ChevronRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="auth-simple-footer">
                <div className="auth-footer-links">
                    <a href="#">Seller Policy</a>
                    <a href="#">Fees & Commissions</a>
                    <a href="#">Help Center</a>
                </div>
                <p>© 2026 B-Mart Seller Central</p>
            </footer>
        </div>
    );
};

export default SellerApplication;