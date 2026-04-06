import './Header.css'
import { useAuth } from '../../../features/auth/AuthProvider.jsx'
import { useCart } from '../../../features/storefront/hooks/useCart'
import { unitProductPrice } from '../../../utils/unitProductPrice.js'
import { formatEtb } from '../../../utils/formatEtb.js'
import {
    Search,
    User,
    ShoppingCart,
    Menu,
    MapPin,
    Headphones,
    ChevronDown,
    LogIn,
    UserPlus,
    LayoutDashboard,
    LogOut,
    ListOrdered,
    Heart
} from 'lucide-react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Header = ({ onMenuClick }) => {
    const { user, isAuthenticated, isSeller, logout } = useAuth()
    const { cartItems } = useCart()
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (location.pathname !== '/search') return;
        const params = new URLSearchParams(location.search);
        setSearchQuery(params.get('q') ?? '');
    }, [location.pathname, location.search]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const itemCount = cartItems?.length || 0;
    const cartTotal = Array.isArray(cartItems)
        ? cartItems.reduce((total, item) => total + unitProductPrice(item?.product) * item.quantity, 0)
        : 0;

    return (
        <header className="header-container">
            {!isSeller && (
                <div className="top-bar">
                    <div className="top-bar-left">
                        <div className="top-info-item">
                            <MapPin size={14} />
                            <span>Free shipping over 5,000 ETB</span>
                        </div>
                        <div className="top-info-item">
                            <Headphones size={14} />
                            <span>24/7 Support</span>
                        </div>
                    </div>
                    <div className="top-bar-links">
                        <span>Track Order</span>
                        <span className="divider">|</span>
                        <span
                            className='sell-on-b-mart'
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                if (isAuthenticated) {
                                    navigate('/apply-to-sell');
                                } else {
                                    navigate('/login', { state: { from: '/apply-to-sell' } });
                                }
                            }}
                        >
                            Sell on B-Mart
                        </span>
                    </div>
                </div>
            )}

            <div className="main-header">
                <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <div className="logo">
                        <img src="/eco.svg" alt="B-Mart" id='logo-img' />
                        <span className="brand-name">B-Mart</span>
                    </div>
                </div>

                <div className="search-wrapper">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder='Search for products, brands...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="search-btn" onClick={handleSearch}>
                            <Search size={20} />
                            <span>Search</span>
                        </button>
                    </div>
                </div>

                <div className="utilities-container">
                    <div className="utility-item account-dropdown-container">
                        <Link to={isAuthenticated ? "/profile" : "/login"} className="account-trigger">
                            <div className="icon-badge-wrap">
                                <User size={24} />
                            </div>
                            <div className="utility-text">
                                <span className="welcome-label">Hello, {isAuthenticated ? user?.name?.split(' ')[0] : "Sign In"}</span>
                                <span className="account-sub-label">Account <ChevronDown size={12} /></span>
                            </div>
                        </Link>

                        <div className="auth-dropdown-menu">
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="dropdown-link">
                                        <LogIn size={16} />
                                        <span>Login</span>
                                    </Link>
                                    <Link to="/register" className="dropdown-link">
                                        <UserPlus size={16} />
                                        <span>Create Account</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/profile" className="dropdown-link"><User size={18} />Profile</Link>
                                    <Link to="/my-order" className="dropdown-link"><ListOrdered size={18} />My Orders</Link>
                                    <Link to="/wishlist" className="dropdown-link"><Heart size={18} />Wishlist</Link>
                                    <button onClick={logout} className="dropdown-link logout-btn"><LogOut size={18} />Logout</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="utility-item" onClick={() => {
                        if (isAuthenticated) {
                            navigate('/cart');
                        } else {
                            navigate('/login', { state: { from: '/cart' } });
                        }
                    }}>
                        <div className="icon-badge-wrap">
                            <ShoppingCart size={24} />
                            <span className="cart-badge">{itemCount}</span>
                        </div>
                        <div className="utility-text">
                            <span className="cart-label">Your Cart</span>
                            <span className="cart-sub-label">{formatEtb(cartTotal)}</span>
                        </div>
                    </div>
                </div>
            </div >

            {location.pathname !== '/cart' && (
                <nav className="bottom-nav">
                    <div className="nav-content" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            <button className='category-toggle' onClick={onMenuClick}>
                                <Menu size={20} />
                            </button>
                            <ul className="nav-links">
                                <li><NavLink to="/" end>Home</NavLink></li>
                                <li><NavLink to="/categories">All Categories</NavLink></li>
                                <li><NavLink to="/discounts">Discounts</NavLink></li>
                                <li><NavLink to="/best-sellers">Best Sellers</NavLink></li>
                                <li><NavLink to="/new-releases">New Releases</NavLink></li>
                            </ul>
                        </div>
                        {isSeller && (
                            <Link to="/seller/dashboard" style={{
                                textDecoration: 'none',
                                fontWeight: '600',
                                color: 'var(--primary)',
                                background: 'var(--accent)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <LayoutDashboard size={18} />
                                Seller Dashboard
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </header>
    )
}

export default Header