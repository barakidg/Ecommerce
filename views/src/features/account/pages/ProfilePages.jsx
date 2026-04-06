import { useState, useRef, useMemo, useEffect } from 'react';
import './ProfilePages.css';
import {
    User, Mail, Package, Heart, Settings,
    ShieldCheck, LogOut, LayoutDashboard, ShoppingBag,
    ChevronRight, Edit3, CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../../auth/api/authApi';
import { toast } from 'react-hot-toast';
import { useOrder } from '../../storefront/hooks/useOrder';
import { useSellerDashboard } from '../../seller/hooks/useSellerDashboard';
import { useSellerInventoryProducts } from '../../seller/hooks/useSellerInventory';

const ProfilePage = () => {
    const { user, isSeller, isAdmin, logout } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: user?.name || '', email: user?.email || '' });
    const fileInputRef = useRef(null);

    const { orders, isLoading: ordersLoading } = useOrder();
    const { data: sellerDash, isLoading: sellerDashLoading } = useSellerDashboard({
        enabled: isSeller
    });
    const { data: sellerProducts = [], isLoading: sellerProductsLoading } = useSellerInventoryProducts({
        enabled: isSeller
    });

    useEffect(() => {
        if (user && !isEditing) {
            setEditForm({ name: user.name || '', email: user.email || '' });
        }
    }, [user, isEditing]);

    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['authUser'], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['authUser'] });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profilePicture', file);
            updateProfileMutation.mutate(formData);
        }
    };

    const handleEditSubmit = () => {
        const formData = new FormData();
        if (editForm.name) formData.append('name', editForm.name);
        if (editForm.email) formData.append('email', editForm.email);
        updateProfileMutation.mutate(formData);
    };

    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : '—';

    const roleLabel = isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER';

    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=001e2b&color=fff&size=200`;

    const totalBuyerOrders = orders.length;
    const unitsSold = sellerDash?.stats?.unitsSold ?? 0;

    const activities = useMemo(() => {
        const items = [];

        for (const order of orders) {
            const first = order.items?.[0]?.product;
            const thumb = first?.productImages?.[0]?.url;
            const subtitle =
                order.items?.length > 1
                    ? `${first?.name || 'Product'} +${order.items.length - 1} more`
                    : first?.name || 'Order';

            items.push({
                id: `order-${order.id}`,
                kind: 'purchase',
                at: new Date(order.createdAt).getTime(),
                statusLabel: `Order · ${order.status?.replace(/_/g, ' ') || 'Placed'}`,
                subtitle,
                thumb,
                onClick: () =>
                    navigate('/my-order', { state: { from: 'profile', openOrderId: order.id } })
            });
        }

        if (isSeller && Array.isArray(sellerDash?.recentSales)) {
            for (const line of sellerDash.recentSales) {
                const thumb = line.product?.productImages?.[0]?.url;
                items.push({
                    id: `sale-${line.id}`,
                    kind: 'sale',
                    at: new Date(line.order?.createdAt || 0).getTime(),
                    statusLabel: 'Sale',
                    subtitle: `${line.quantity}× ${line.product?.name || 'Item'}`,
                    thumb,
                    onClick: () => navigate('/seller/orders')
                });
            }
        }

        if (isSeller && Array.isArray(sellerProducts)) {
            for (const p of sellerProducts) {
                if (!p?.createdAt) continue;
                const thumb = p.productImages?.[0]?.url;
                items.push({
                    id: `listing-${p.id}`,
                    kind: 'listing',
                    at: new Date(p.createdAt).getTime(),
                    statusLabel: 'New listing',
                    subtitle: p.name,
                    thumb,
                    onClick: () => navigate(`/product/${p.id}`)
                });
            }
        }

        return items.sort((a, b) => b.at - a.at).slice(0, 10);
    }, [orders, isSeller, sellerDash?.recentSales, sellerProducts, navigate]);

    const activityLoading =
        ordersLoading || (isSeller && (sellerDashLoading || sellerProductsLoading));

    return (
        <div className="profile-wrapper">
            <div className="profile-container">
                <aside className="profile-nav-card">
                    <div className="profile-header-mini">
                        <div className="avatar-wrapper">
                            <img src={user?.profilePic || avatarFallback} alt="Profile" />
                            <button
                                type="button"
                                className="edit-avatar"
                                onClick={() => fileInputRef.current.click()}
                                disabled={updateProfileMutation.isPending}
                            >
                                <Edit3 size={14} />
                            </button>
                            <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
                        </div>
                        <h3>{user?.name || '—'}</h3>
                        <p className="user-role-badge">{roleLabel}</p>
                    </div>

                    <nav className="profile-menu">
                        <button type="button" className="menu-item active">
                            <User size={18} /> Account Info
                        </button>
                        <Link
                            to="/my-order"
                            state={{ from: 'profile' }}
                            className="menu-item"
                        >
                            <Package size={18} /> My Orders
                        </Link>
                        <Link to="/wishlist" className="menu-item">
                            <Heart size={18} /> Wishlist
                        </Link>
                        <button type="button" className="menu-item">
                            <CreditCard size={18} /> Payments
                        </button>
                        <div className="menu-divider" />
                        <button type="button" className="menu-item">
                            <Settings size={18} /> Settings
                        </button>
                        <button type="button" className="menu-item logout" onClick={() => logout()}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    </nav>
                </aside>

                <main className="profile-content">
                    <div className="profile-main-grid">
                        <section className="info-card">
                            <div className="card-header">
                                <h2>Personal Details</h2>
                                {!isEditing && (
                                    <button
                                        type="button"
                                        className="profile-edit-profile-btn"
                                        onClick={() => {
                                            setIsEditing(true);
                                            setEditForm({
                                                name: user?.name || '',
                                                email: user?.email || ''
                                            });
                                        }}
                                    >
                                        <Edit3 size={16} />
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className="details-list">
                                <div className={`detail-row ${isEditing ? 'detail-row--edit' : ''}`}>
                                    <label>
                                        <User size={16} /> Name
                                    </label>
                                    {isEditing ? (
                                        <div className="detail-input-wrap">
                                            <input
                                                type="text"
                                                className="detail-input"
                                                value={editForm.name}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, name: e.target.value })
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <span>{user?.name || '—'}</span>
                                    )}
                                </div>
                                <div className={`detail-row ${isEditing ? 'detail-row--edit' : ''}`}>
                                    <label>
                                        <Mail size={16} /> Email
                                    </label>
                                    {isEditing ? (
                                        <div className="detail-input-wrap">
                                            <input
                                                type="email"
                                                className="detail-input"
                                                value={editForm.email}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, email: e.target.value })
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <span>{user?.email || '—'}</span>
                                    )}
                                </div>
                                <div className="detail-row">
                                    <label>
                                        <ShieldCheck size={16} /> Member Since
                                    </label>
                                    <span>{joinedDate}</span>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="profile-form-actions">
                                    <button
                                        type="button"
                                        className="profile-btn profile-btn--ghost"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-btn profile-btn--primary"
                                        onClick={handleEditSubmit}
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </section>

                        <div className="profile-stats-grid">
                            <div className="stat-box">
                                <span className="stat-label">Total orders</span>
                                <span className="stat-value">{ordersLoading ? '…' : totalBuyerOrders}</span>
                                <ShoppingBag className="stat-icon" size={40} />
                            </div>
                            {isSeller && (
                                <div className="stat-box orange">
                                    <span className="stat-label">Products sold</span>
                                    <span className="stat-value">
                                        {sellerDashLoading ? '…' : unitsSold}
                                    </span>
                                    <LayoutDashboard className="stat-icon" size={40} />
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="activity-card">
                        <div className="card-header">
                            <h2>Recent activity</h2>
                            <Link
                                to="/my-order"
                                state={{ from: 'profile' }}
                                className="view-all"
                            >
                                View orders
                            </Link>
                        </div>
                        {activityLoading ? (
                            <p className="activity-empty">Loading recent activity…</p>
                        ) : activities.length === 0 ? (
                            <p className="activity-empty">
                                No recent activity yet. Orders and store actions will show up here.
                            </p>
                        ) : (
                            <div className="activity-list">
                                {activities.map((a) => (
                                    <div
                                        key={a.id}
                                        role="button"
                                        tabIndex={0}
                                        className={`activity-item activity-item--${a.kind}`}
                                        onClick={a.onClick}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                a.onClick();
                                            }
                                        }}
                                    >
                                        <div className="item-thumb">
                                            <img src={a.thumb} alt="" />
                                        </div>
                                        <div className="item-meta">
                                            <p className="item-status">{a.statusLabel}</p>
                                            <p className="item-name">{a.subtitle}</p>
                                        </div>
                                        <div className="item-date">
                                            {new Date(a.at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <ChevronRight size={18} className="chevron" aria-hidden />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
