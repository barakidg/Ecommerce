import './Sidebar.css'
import { useAuth } from '../../../features/auth/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom'
import {
    X,
    User,
    Package,
    ShoppingCart,
    Smartphone,
    Shirt,
    Home,
    Sparkles,
    Book,
    HelpCircle,
    Settings,
    LogOut,
    Store
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout, isSeller, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

            <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>

                    {!isAuthenticated ? (
                        <div className="auth-prompt-container" onClick={() => { navigate('/login'); onClose(); }}>
                            <div className="guest-avatar">
                                <User size={30} />
                            </div>
                            <div className="auth-text">
                                <h3>B-Mart</h3>
                                <p>Sign in for the best experience</p>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-section" onClick={() => { navigate('/profile'); onClose(); }}>
                            <div className='sidebar-profile-img'>
                                {user?.profilePic ? <img src={user.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={28} />}
                            </div>
                            <div className="profile-text">
                                <p className="user-name">{user?.name || "User"}</p>
                                <p className="user-role">{isSeller ? 'Verified Seller' : 'Customer'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <div className="menu-group">
                        <h4 className="menu-title">Categories</h4>
                        <ul>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=Electronics'); onClose(); }}>
                                <Smartphone size={20} /> Electronics
                            </li>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=Fashion'); onClose(); }}>
                                <Shirt size={20} /> Fashion
                            </li>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=' + encodeURIComponent('Food & Beverages')); onClose(); }}>
                                <Package size={20} /> Food & Beverages
                            </li>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=' + encodeURIComponent('Beauty & Personal Care')); onClose(); }}>
                                <Sparkles size={20} /> Beauty & Personal Care
                            </li>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=Automotive'); onClose(); }}>
                                <ShoppingCart size={20} /> Automotive
                            </li>
                            <li className="nav-item" onClick={() => { navigate('/category-discovery?cat=' + encodeURIComponent('Home & Garden')); onClose(); }}>
                                <Home size={20} /> Home & Garden
                            </li>
                        </ul>
                    </div>

                </nav>

                <div className="sidebar-footer">
                    {!isSeller && (
                        <div
                            className="sell-promo"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                if (isAuthenticated) {
                                    navigate('/apply-to-sell');
                                } else {
                                    navigate('/login', { state: { from: '/apply-to-sell' } });
                                }
                                onClose();
                            }}
                        >
                            <Store size={20} />
                            <div className="promo-text">
                                <strong>Sell on B-Mart</strong>
                                <span>Start earning today</span>
                            </div>
                        </div>
                    )}


                    <div className="footer-links">
                        <div className="footer-item"><HelpCircle size={18} /> Help Center</div>
                        <div className="footer-item"><Settings size={18} /> Settings</div>
                        {isAuthenticated && (
                            <button className='sidebar-logout' onClick={logout}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar