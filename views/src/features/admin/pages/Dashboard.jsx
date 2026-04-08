import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useIsFetching, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import './Dashboard.css';
import {
    Users,
    Store,
    ShieldCheck,
    AlertTriangle,
    BarChart3,
    Settings,
    Search,
    Bell,
    CheckCircle,
    XCircle,
    Activity,
    LogOut,
    Sparkles,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useAdminSellers } from '../hooks/useAdminSellers';
import { useAdminFeaturedData } from '../hooks/useAdminFeatured';
import {
    getAdminDashboardStats,
    getAdminCompanyOverview,
    getAdminProducts,
    getAdminDisputes,
    resolveAdminDispute,
    getAdminDeliveryPayouts,
    processAdminDeliveryPayout
} from '../api/adminApi.js';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('Featured');
    const queryClient = useQueryClient();
    const { logout } = useAuth();
    const {
        pendingRequests,
        verifiedSellers,
        verifySeller,
        isVerifying,
        isLoadingPending,
        isLoadingVerified,
        updateSellerStatus,
        isUpdatingSellerStatus
    } = useAdminSellers();
    const {
        requests: featuredRequests,
        activeFeatured,
        isLoadingRequests: featuredReqLoading,
        isLoadingActive: featuredActiveLoading,
        reviewRequest,
        removeFeatured,
        isReviewing,
        isRemoving
    } = useAdminFeaturedData();

    const { data: dashStats, isPending: statsLoading } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: getAdminDashboardStats,
        enabled: activeTab === 'Overview'
    });
    const { data: companyOverview, isPending: companyLoading } = useQuery({
        queryKey: ['adminCompanyOverview'],
        queryFn: getAdminCompanyOverview,
        enabled: activeTab === 'Company'
    });

    const { data: inventoryProducts = [], isPending: inventoryLoading } = useQuery({
        queryKey: ['adminProducts'],
        queryFn: async () => {
            const { products } = await getAdminProducts();
            return products;
        },
        enabled: activeTab === 'Inventory'
    });

    const { data: adminDisputes = [], isPending: disputesLoading } = useQuery({
        queryKey: ['adminDisputes'],
        queryFn: getAdminDisputes,
        enabled: activeTab === 'Disputes'
    });

    const { data: adminDeliveryPayouts = [], isPending: deliveryPayLoading } = useQuery({
        queryKey: ['adminDeliveryPayouts'],
        queryFn: getAdminDeliveryPayouts,
        enabled: activeTab === 'Delivery'
    });

    const resolveDisputeMutation = useMutation({
        mutationFn: resolveAdminDispute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            toast.success('Dispute resolved.');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not resolve dispute.')
    });

    const processDeliveryPayMutation = useMutation({
        mutationFn: processAdminDeliveryPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDeliveryPayouts'] });
            toast.success('Delivery payout updated.');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not process payout.')
    });

    const fetchingAdmin = useIsFetching({
        predicate: (q) => {
            const key = q.queryKey[0];
            return (
                key === 'adminFeaturedRequests' ||
                key === 'adminFeaturedProducts' ||
                key === 'adminDashboardStats' ||
                (key === 'admin' && (q.queryKey[1] === 'sellerRequests' || q.queryKey[1] === 'verifiedSellers')) ||
                key === 'adminProducts' ||
                key === 'adminDisputes' ||
                key === 'adminDeliveryPayouts' ||
                key === 'adminCompanyOverview'
            );
        }
    });

    const refreshFeatured = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['adminFeaturedRequests'] });
        queryClient.invalidateQueries({ queryKey: ['adminFeaturedProducts'] });
    }, [queryClient]);

    const refreshOverview = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'sellerRequests'] });
    }, [queryClient]);

    const handleMainRefresh = useCallback(() => {
        if (activeTab === 'Featured') refreshFeatured();
        else if (activeTab === 'Overview') refreshOverview();
        else if (activeTab === 'Sellers') queryClient.invalidateQueries({ queryKey: ['admin', 'verifiedSellers'] });
        else if (activeTab === 'Inventory') queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
        else if (activeTab === 'Disputes') queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
        else if (activeTab === 'Delivery') queryClient.invalidateQueries({ queryKey: ['adminDeliveryPayouts'] });
        else if (activeTab === 'Company') queryClient.invalidateQueries({ queryKey: ['adminCompanyOverview'] });
    }, [activeTab, queryClient, refreshFeatured, refreshOverview]);

    const handleApprove = (id) => verifySeller({ sellerId: id, status: 'VERIFIED' });
    const handleReject = (id) => {
        const note = window.prompt("Enter rejection reason (optional):");
        if (note !== null) {
            verifySeller({ sellerId: id, status: 'REJECTED', rejectionNote: note });
        }
    };

    const platformStats = useMemo(() => {
        const fmt = (n) => (n != null && !Number.isNaN(Number(n)) ? Number(n).toLocaleString() : '—');
        const users = dashStats?.totalRegisteredUsers;
        const sellers = dashStats?.totalSellers;
        const pending = dashStats?.pendingSellerApprovals;
        const openD = dashStats?.openDisputes;
        const pendDel = dashStats?.pendingDeliveryPayouts;
        return [
            { label: 'Total Users', count: statsLoading ? '…' : fmt(users), icon: <Users />, color: '#3b82f6' },
            { label: 'Active Sellers', count: statsLoading ? '…' : fmt(sellers), icon: <Store />, color: '#10b981' },
            { label: 'Pending Approvals', count: statsLoading ? '…' : fmt(pending), icon: <ShieldCheck />, color: '#f59e0b' },
            { label: 'Open Disputes', count: statsLoading ? '…' : fmt(openD), icon: <AlertTriangle />, color: '#ef4444' },
            { label: 'Courier payouts (pending)', count: statsLoading ? '…' : fmt(pendDel), icon: <Activity />, color: '#8b5cf6' }
        ];
    }, [dashStats, statsLoading]);

    return (
        <div className="admin-page">
            <header className="admin-header">
                <div className="admin-header-left">
                    <Link to="/" className="auth-logo">
                        <img src="/eco.svg" alt="B-Mart" />
                        <span>Admin <small>Hub</small></span>
                    </Link>
                    <nav className="admin-main-nav">
                        {['Featured', 'Overview', 'Users', 'Sellers', 'Inventory', 'Disputes', 'Delivery', 'Company', 'Reports'].map(tab => (
                            <button
                                key={tab}
                                className={activeTab === tab ? 'active' : ''}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="admin-header-right">
                    <div className="admin-search">
                        <Search size={18} />
                        <input type="text" placeholder="Search orders, users..." />
                    </div>
                    <div className="admin-notif">
                        <Bell size={20} />
                        <span className="dot"></span>
                    </div>
                    <div className="admin-profile">
                        <div className="admin-avatar">A</div>
                    </div>
                </div>
            </header>

            <div className="admin-body">
                <aside className="admin-sidebar">
                    <div className="sidebar-group">
                        <label>Management</label>
                        <button className="sidebar-link active"><Activity size={18} /> System Health</button>
                        <button className="sidebar-link"><ShieldCheck size={18} /> Permissions</button>
                        <button className="sidebar-link"><AlertTriangle size={18} /> Flagged Content</button>
                    </div>
                    <div className="sidebar-group">
                        <label>Settings</label>
                        <button className="sidebar-link"><BarChart3 size={18} /> Analytics</button>
                        <button className="sidebar-link"><Settings size={18} /> Platform Config</button>
                    </div>
                    <div className="sidebar-group" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                        <button className="sidebar-link" onClick={logout} style={{ color: '#ef4444' }}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </aside>

                <main className="admin-content">
                    <div className="content-header">
                        <h2>{activeTab}</h2>
                        {(activeTab === 'Featured' || activeTab === 'Overview' || activeTab === 'Sellers' || activeTab === 'Inventory' || activeTab === 'Disputes' || activeTab === 'Delivery' || activeTab === 'Company') && (
                            <button
                                type="button"
                                className={`btn-refresh ${fetchingAdmin ? 'btn-refresh--busy' : ''}`}
                                onClick={handleMainRefresh}
                                disabled={!!fetchingAdmin}
                                aria-busy={!!fetchingAdmin}
                            >
                                <RefreshCw size={17} className="btn-refresh__icon" />
                                <span>Refresh</span>
                            </button>
                        )}
                    </div>

                    {activeTab === 'Featured' && (
                        <>
                            <div className="management-table-container card-surface" style={{ marginBottom: '1.5rem' }}>
                                <div className="table-header">
                                    <div className="table-header-titles">
                                        <h3><Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: '#f59e0b' }} /> Featured — pending requests</h3>
                                        <span className="table-header-sub">Seller promotion requests</span>
                                    </div>
                                    <button type="button" className="btn-section-refresh" onClick={refreshFeatured} title="Refresh pending requests" aria-label="Refresh pending requests">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="admin-table-scroll">
                                    <table className="admin-table admin-table--featured">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Seller</th>
                                                <th>Duration</th>
                                                <th>Requested</th>
                                                <th className="admin-table__col-actions">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {featuredReqLoading ? (
                                                <tr><td colSpan="5" className="admin-table__empty">Loading…</td></tr>
                                            ) : featuredRequests.length === 0 ? (
                                                <tr><td colSpan="5" className="admin-table__empty">No pending feature requests.</td></tr>
                                            ) : (
                                                featuredRequests.map((req) => (
                                                    <tr key={req.id}>
                                                        <td>
                                                            <div className="user-info-cell">
                                                                {req.product?.productImages?.[0]?.url ? (
                                                                    <img src={req.product.productImages[0].url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className="avatar-sm">?</div>
                                                                )}
                                                                <div className="user-info-cell__text">
                                                                    <strong>{req.product?.name || '—'}</strong>
                                                                    <small>{req.product?.category || ''}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="admin-table__ellipsis" title={req.sellerProfile?.businessName || req.sellerProfile?.user?.email || ''}>
                                                                {req.sellerProfile?.businessName || req.sellerProfile?.user?.email || '—'}
                                                            </span>
                                                        </td>
                                                        <td>{req.durationDays} days</td>
                                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                                        <td className="table-btns admin-table__col-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-approve"
                                                                disabled={isReviewing}
                                                                title="Approve"
                                                                onClick={() => reviewRequest({ requestId: req.id, decision: 'approve' })}
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-reject"
                                                                disabled={isReviewing}
                                                                title="Reject"
                                                                onClick={() => {
                                                                    const note = window.prompt('Optional note to seller:') ?? '';
                                                                    reviewRequest({ requestId: req.id, decision: 'reject', rejectionNote: note || undefined });
                                                                }}
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="management-table-container card-surface">
                                <div className="table-header">
                                    <div className="table-header-titles">
                                        <h3>Live featured products</h3>
                                        <span className="table-header-sub">Visible on the storefront home page</span>
                                    </div>
                                    <button type="button" className="btn-section-refresh" onClick={refreshFeatured} title="Refresh live featured" aria-label="Refresh live featured">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="admin-table-scroll">
                                    <table className="admin-table admin-table--featured-live">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Seller</th>
                                                <th>Until</th>
                                                <th className="admin-table__col-actions">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {featuredActiveLoading ? (
                                                <tr><td colSpan="4" className="admin-table__empty">Loading…</td></tr>
                                            ) : activeFeatured.length === 0 ? (
                                                <tr><td colSpan="4" className="admin-table__empty">No active featured listings.</td></tr>
                                            ) : (
                                                activeFeatured.map((prod) => (
                                                    <tr key={prod.id}>
                                                        <td>
                                                            <div className="user-info-cell">
                                                                {prod.productImages?.[0]?.url ? (
                                                                    <img src={prod.productImages[0].url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className="avatar-sm">?</div>
                                                                )}
                                                                <div className="user-info-cell__text">
                                                                    <strong>{prod.name}</strong>
                                                                    <small>{prod.category || ''}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className="admin-table__ellipsis" title={prod.sellerProfile?.businessName || ''}>{prod.sellerProfile?.businessName || '—'}</span></td>
                                                        <td>
                                                            {prod.featuredUntil
                                                                ? new Date(prod.featuredUntil).toLocaleString()
                                                                : 'No end date'}
                                                        </td>
                                                        <td className="table-btns admin-table__col-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-reject"
                                                                disabled={isRemoving}
                                                                title="Remove from featured"
                                                                onClick={() => removeFeatured(prod.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Overview' && (
                        <>
                            <div className="platform-stats-grid">
                                {platformStats.map((stat, i) => (
                                    <div key={i} className="p-stat-card">
                                        <div className="p-stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
                                            {stat.icon}
                                        </div>
                                        <div className="p-stat-info">
                                            <h3>{stat.count}</h3>
                                            <p>{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="management-table-container card-surface">
                                <div className="table-header">
                                    <div className="table-header-titles">
                                        <h3>Seller Approval Queue</h3>
                                        <span className="table-header-sub">Requires attention</span>
                                    </div>
                                    <button type="button" className="btn-section-refresh" onClick={refreshOverview} title="Refresh approval queue" aria-label="Refresh approval queue">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="admin-table-scroll">
                                    <table className="admin-table admin-table--approvals">
                                        <thead>
                                            <tr>
                                                <th>Applicant</th>
                                                <th>Bank Name</th>
                                                <th>Date Applied</th>
                                                <th>Status</th>
                                                <th className="admin-table__col-actions">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoadingPending ? (
                                                <tr><td colSpan="5" className="admin-table__empty">Loading requests…</td></tr>
                                            ) : pendingRequests.length === 0 ? (
                                                <tr><td colSpan="5" className="admin-table__empty">No pending requests found.</td></tr>
                                            ) : (
                                                pendingRequests.map(request => (
                                                    <tr key={request.id}>
                                                        <td>
                                                            <div className="user-info-cell user-info-cell--stack">
                                                                <div className="avatar-sm">{request.businessName?.charAt(0) || 'U'}</div>
                                                                <div className="user-info-cell__text">
                                                                    <strong>{request.businessName || 'N/A'}</strong>
                                                                    <small>{request.user?.email || 'N/A'}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className="admin-table__ellipsis" title={request.bankName || ''}>{request.bankName || '—'}</span></td>
                                                        <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                                                        <td><span className="badge-pending">Pending</span></td>
                                                        <td className="table-btns admin-table__col-actions">
                                                            <button className="btn-approve" onClick={() => handleApprove(request.id)} disabled={isVerifying} title="Approve">
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button className="btn-reject" onClick={() => handleReject(request.id)} disabled={isVerifying} title="Reject">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Sellers' && (
                        <div className="management-table-container card-surface">
                            <div className="table-header">
                                <div className="table-header-titles">
                                    <h3>Sellers</h3>
                                    <span className="table-header-sub">Active and suspended accounts</span>
                                </div>
                            </div>
                            <div className="admin-table-scroll">
                                <table className="admin-table admin-table--sellers">
                                    <thead>
                                        <tr>
                                            <th className="admin-table__col-seller">Seller</th>
                                            <th className="admin-table__col-tax">Tax ID</th>
                                            <th className="admin-table__col-date">Date verified</th>
                                            <th className="admin-table__col-status">Status</th>
                                            <th className="admin-table__col-actions">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingVerified ? (
                                            <tr><td colSpan="5" className="admin-table__empty">Loading sellers…</td></tr>
                                        ) : verifiedSellers.length === 0 ? (
                                            <tr><td colSpan="5" className="admin-table__empty">No verified sellers found.</td></tr>
                                        ) : (
                                            verifiedSellers.map(seller => (
                                                <tr key={seller.id}>
                                                    <td className="admin-table__col-seller">
                                                        <div className="user-info-cell user-info-cell--stack">
                                                            <div className="avatar-sm">{seller.businessName?.charAt(0) || 'U'}</div>
                                                            <div className="user-info-cell__text">
                                                                <strong>{seller.businessName || 'N/A'}</strong>
                                                                <small>{seller.user?.email || 'N/A'}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="admin-table__col-tax"><span className="admin-table__mono">{seller.taxId || '—'}</span></td>
                                                    <td className="admin-table__col-date">{new Date(seller.verifiedAt || seller.createdAt).toLocaleDateString()}</td>
                                                    <td className="admin-table__col-status">
                                                        {seller.status === 'SUSPENDED' ? (
                                                            <span className="badge-suspended">Suspended</span>
                                                        ) : (
                                                            <span className="badge-verified">Verified</span>
                                                        )}
                                                    </td>
                                                    <td className="table-btns admin-table__col-actions">
                                                        {seller.status === 'SUSPENDED' ? (
                                                            <button
                                                                type="button"
                                                                className="btn-approve"
                                                                disabled={isUpdatingSellerStatus}
                                                                title="Restore seller (active selling)"
                                                                onClick={() =>
                                                                    updateSellerStatus({
                                                                        sellerProfileId: seller.id,
                                                                        status: 'VERIFIED'
                                                                    })
                                                                }
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn-reject"
                                                                disabled={isUpdatingSellerStatus}
                                                                title="Suspend seller"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Suspend "${seller.businessName || 'this seller'}"? They will not access the seller portal until restored.`
                                                                        )
                                                                    ) {
                                                                        updateSellerStatus({
                                                                            sellerProfileId: seller.id,
                                                                            status: 'SUSPENDED'
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <AlertTriangle size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Inventory' && (
                        <div className="management-table-container card-surface">
                            <div className="table-header">
                                <div className="table-header-titles">
                                    <h3>Platform inventory</h3>
                                    <span className="table-header-sub">Recent products (newest first)</span>
                                </div>
                            </div>
                            <div className="admin-table-scroll">
                                <table className="admin-table admin-table--inventory">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Seller</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventoryLoading ? (
                                            <tr><td colSpan="6" className="admin-table__empty">Loading products…</td></tr>
                                        ) : inventoryProducts.length === 0 ? (
                                            <tr><td colSpan="6" className="admin-table__empty">No products found.</td></tr>
                                        ) : (
                                            inventoryProducts.map((p) => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="user-info-cell user-info-cell--stack">
                                                            {p.productImages?.[0]?.url ? (
                                                                <img src={p.productImages[0].url} alt="" className="admin-table__thumb" />
                                                            ) : (
                                                                <div className="avatar-sm">?</div>
                                                            )}
                                                            <div className="user-info-cell__text">
                                                                <strong>{p.name}</strong>
                                                                <small>{p.category || '—'}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="admin-table__ellipsis">{p.sellerProfile?.businessName || '—'}</span></td>
                                                    <td className="admin-table__mono">{Number(p.price).toLocaleString()} ETB</td>
                                                    <td>{p.stock ?? 0}</td>
                                                    <td>{p.archived ? <span className="badge-archived">Archived</span> : <span className="badge-live">Live</span>}</td>
                                                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Disputes' && (
                        <div className="management-table-container card-surface">
                            <div className="table-header">
                                <div className="table-header-titles">
                                    <h3>Order disputes</h3>
                                    <span className="table-header-sub">
                                        Refund buyer (escrow reversed) or side with seller; optional internal note.
                                    </span>
                                </div>
                            </div>
                            <div className="admin-table-scroll">
                                <table className="admin-table admin-table--disputes">
                                    <thead>
                                        <tr>
                                            <th>Buyer</th>
                                            <th>Order</th>
                                            <th>Scope</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th className="admin-table__col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disputesLoading ? (
                                            <tr><td colSpan="6" className="admin-table__empty">Loading…</td></tr>
                                        ) : adminDisputes.length === 0 ? (
                                            <tr><td colSpan="6" className="admin-table__empty">No disputes.</td></tr>
                                        ) : (
                                            adminDisputes.map((d) => (
                                                <tr key={d.id}>
                                                    <td>
                                                        <div className="user-info-cell__text">
                                                            <strong>{d.user?.name || '—'}</strong>
                                                            <small>{d.user?.email}</small>
                                                        </div>
                                                    </td>
                                                    <td className="admin-table__mono">{d.order?.id?.slice(0, 8)}…</td>
                                                    <td>
                                                        {d.orderItemId
                                                            ? `Line ${d.orderItemId.slice(0, 8)}…`
                                                            : 'Whole order'}
                                                    </td>
                                                    <td>
                                                        <span className="admin-table__ellipsis" title={d.reason}>
                                                            {d.reason}
                                                        </span>
                                                    </td>
                                                    <td>{d.status}</td>
                                                    <td className="table-btns admin-table__col-actions">
                                                        {d.status === 'OPEN' ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn-approve"
                                                                    title="Refund buyer"
                                                                    disabled={resolveDisputeMutation.isPending}
                                                                    onClick={() => {
                                                                        const note =
                                                                            window.prompt('Optional admin note:') ?? '';
                                                                        resolveDisputeMutation.mutate({
                                                                            disputeId: d.id,
                                                                            status: 'RESOLVED_IN_FAVOR_OF_BUYER',
                                                                            adminResolutionNote: note || undefined
                                                                        });
                                                                    }}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-reject"
                                                                    title="Seller — no refund"
                                                                    disabled={resolveDisputeMutation.isPending}
                                                                    onClick={() => {
                                                                        const note =
                                                                            window.prompt('Optional admin note:') ?? '';
                                                                        resolveDisputeMutation.mutate({
                                                                            disputeId: d.id,
                                                                            status: 'RESOLVED_IN_FAVOR_OF_SELLER',
                                                                            adminResolutionNote: note || undefined
                                                                        });
                                                                    }}
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: 13 }}>Closed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Delivery' && (
                        <div className="management-table-container card-surface">
                            <div className="table-header">
                                <div className="table-header-titles">
                                    <h3>Courier payout requests</h3>
                                    <span className="table-header-sub">
                                        Fake ledger today — mark SUCCESS after you pay them via Chapa / bank manually.
                                    </span>
                                </div>
                            </div>
                            <div className="admin-table-scroll">
                                <table className="admin-table admin-table--delivery-pay">
                                    <thead>
                                        <tr>
                                            <th>Courier</th>
                                            <th>Amount</th>
                                            <th>Provider</th>
                                            <th>Status</th>
                                            <th>Requested</th>
                                            <th className="admin-table__col-actions">Process</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveryPayLoading ? (
                                            <tr><td colSpan="6" className="admin-table__empty">Loading…</td></tr>
                                        ) : adminDeliveryPayouts.length === 0 ? (
                                            <tr><td colSpan="6" className="admin-table__empty">No delivery payout requests.</td></tr>
                                        ) : (
                                            adminDeliveryPayouts.map((p) => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="user-info-cell__text">
                                                            <strong>{p.deliveryProfile?.user?.name || '—'}</strong>
                                                            <small>{p.deliveryProfile?.user?.email}</small>
                                                        </div>
                                                    </td>
                                                    <td className="admin-table__mono">
                                                        {Number(p.amount).toLocaleString()} ETB
                                                    </td>
                                                    <td>{p.provider}</td>
                                                    <td>{p.status}</td>
                                                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                                                    <td className="table-btns admin-table__col-actions">
                                                        {p.status === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn-approve"
                                                                    title="Paid out"
                                                                    disabled={processDeliveryPayMutation.isPending}
                                                                    onClick={() =>
                                                                        processDeliveryPayMutation.mutate({
                                                                            payoutId: p.id,
                                                                            status: 'SUCCESS'
                                                                        })
                                                                    }
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-reject"
                                                                    title="Reject — return to courier balance"
                                                                    disabled={processDeliveryPayMutation.isPending}
                                                                    onClick={() =>
                                                                        processDeliveryPayMutation.mutate({
                                                                            payoutId: p.id,
                                                                            status: 'FAILED'
                                                                        })
                                                                    }
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: 13 }}>Done</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Company' && (
                        <>
                            <div className="platform-stats-grid">
                                <div className="p-stat-card">
                                    <div className="p-stat-info">
                                        <h3>{companyLoading ? '…' : Number(companyOverview?.company?.balance || 0).toLocaleString()}</h3>
                                        <p>Company available balance (ETB)</p>
                                    </div>
                                </div>
                                <div className="p-stat-card">
                                    <div className="p-stat-info">
                                        <h3>{companyLoading ? '…' : Number(companyOverview?.company?.heldBalance || 0).toLocaleString()}</h3>
                                        <p>Company held balance (ETB)</p>
                                    </div>
                                </div>
                                <div className="p-stat-card">
                                    <div className="p-stat-info">
                                        <h3>{companyLoading ? '…' : Number(companyOverview?.company?.totalCommissionEarned || 0).toLocaleString()}</h3>
                                        <p>Total commission (ETB)</p>
                                    </div>
                                </div>
                                <div className="p-stat-card">
                                    <div className="p-stat-info">
                                        <h3>{companyLoading ? '…' : Number(companyOverview?.company?.totalTaxCollected || 0).toLocaleString()}</h3>
                                        <p>Total taxes (ETB)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="management-table-container card-surface">
                                <div className="table-header">
                                    <div className="table-header-titles">
                                        <h3>Company transaction ledger</h3>
                                        <span className="table-header-sub">Commission, tax, escrow and delivery money flow</span>
                                    </div>
                                </div>
                                <div className="admin-table-scroll">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Type</th>
                                                <th>Bucket</th>
                                                <th>Amount</th>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Order</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companyLoading ? (
                                                <tr><td colSpan="7" className="admin-table__empty">Loading…</td></tr>
                                            ) : (companyOverview?.recentEntries || []).length === 0 ? (
                                                <tr><td colSpan="7" className="admin-table__empty">No company entries yet.</td></tr>
                                            ) : (
                                                (companyOverview?.recentEntries || []).map((e) => (
                                                    <tr key={e.id}>
                                                        <td>{new Date(e.createdAt).toLocaleString()}</td>
                                                        <td>{e.type}</td>
                                                        <td>{e.bucket}</td>
                                                        <td className="admin-table__mono">{Number(e.amount).toLocaleString()} ETB</td>
                                                        <td>{e.fromEntityType || '—'}</td>
                                                        <td>{e.toEntityType || '—'}</td>
                                                        <td className="admin-table__mono">{e.orderId ? `${e.orderId.slice(0, 8)}…` : '—'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <footer className="admin-footer">
                <div className="footer-left">
                    <span>B-Mart Admin Engine v1.0.4</span>
                </div>
                <div className="footer-right">
                    <a href="#">Support</a>
                    <a href="#">Privacy</a>
                    <span>© 2026 B-Mart Global</span>
                </div>
            </footer>
        </div>
    );
};

export default AdminDashboard;