import { Outlet, NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    PackagePlus,
    List,
    ShoppingCart,
    User,
    LogOut,
    Home
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import './PortalLayout.css';

const SellerLayout = () => {
    const { logout } = useAuth();

    return (
        <div className="seller-layout">
            <aside className="seller-sidebar">
                <Link to="/" className="sidebar-brand" style={{ textDecoration: 'none' }}>
                    <img src="/eco.svg" alt="B-Mart" style={{ height: '32px', width: 'auto' }} />
                    <span style={{ fontSize: '26px', fontWeight: '900', color: '#001e2b', letterSpacing: '-1px' }}>B-Mart</span>
                </Link>

                <nav className="sidebar-nav">
                    <NavLink to="/seller/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <LayoutDashboard size={20} /> <span>Overview</span>
                    </NavLink>

                    <NavLink to="/seller/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <List size={20} /> <span>My Inventory</span>
                    </NavLink>

                    <NavLink to="/seller/add-product" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <PackagePlus size={20} /> <span>Add Product</span>
                    </NavLink>

                    <NavLink to="/seller/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <ShoppingCart size={20} /> <span>Orders</span>
                    </NavLink>

                    <div className="nav-divider">Settings</div>

                    <NavLink to="/seller/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <User size={20} /> <span>Store Profile</span>
                    </NavLink>

                    <Link to="/" className="nav-item exit-item">
                        <Home size={20} /> <span>Back to Shopping</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button type="button" className="logout-btn" onClick={logout}><LogOut size={18} /> Logout</button>
                </div>
            </aside>

            <main className="seller-main-content">
                <div className="content-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SellerLayout;
