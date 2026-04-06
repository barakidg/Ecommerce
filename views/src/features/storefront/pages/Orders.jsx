import { useState, useEffect } from 'react';
import {
    Package, Search, MapPin, Phone,
    CreditCard, ArrowLeft, ShoppingBag,
    ExternalLink, CheckCircle2, Clock, Truck, ShieldAlert
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useOrder } from '../hooks/useOrder';
import { openOrderDispute } from '../api/orderApi';
import './Orders.css';

const Orders = () => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeScope, setDisputeScope] = useState('order');
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fromProfile = location.state?.from === 'profile';
    const openOrderId = location.state?.openOrderId;

    const { orders, isLoading } = useOrder();

    const disputeMutation = useMutation({
        mutationFn: openOrderDispute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setDisputeReason('');
            toast.success('Dispute opened. Our team will review it.');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not open dispute.')
    });

    useEffect(() => {
        if (!orders?.length || !openOrderId) return;
        const found = orders.find((o) => o.id === openOrderId);
        if (found) {
            setSelectedOrder(found);
            navigate(location.pathname, { replace: true, state: { from: 'profile' } });
        }
    }, [orders, openOrderId, location.pathname, navigate]);

    useEffect(() => {
        if (!selectedOrder?.id || !orders?.length) return;
        const fresh = orders.find((o) => o.id === selectedOrder.id);
        if (fresh && fresh.updatedAt !== selectedOrder.updatedAt) {
            setSelectedOrder(fresh);
        }
    }, [orders, selectedOrder?.id, selectedOrder?.updatedAt]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle2 size={16} className="text-green" />;
            case 'SHIPPED': return <Truck size={16} className="text-blue" />;
            case 'PROCESSING': return <Truck size={16} className="text-blue" />;
            case 'CONFIRMED': return <Package size={16} className="text-orange" />;
            default: return <Clock size={16} className="text-orange" />;
        }
    };

    const submitDispute = () => {
        if (!selectedOrder) return;
        if (disputeReason.trim().length < 10) {
            toast.error('Please describe the issue in at least 10 characters.');
            return;
        }
        const orderItemId =
            disputeScope !== 'order' ? disputeScope : undefined;
        disputeMutation.mutate({
            orderId: selectedOrder.id,
            reason: disputeReason.trim(),
            orderItemId
        });
    };

    const backToProfileBar = fromProfile ? (
        <div className="orders-profile-back">
            <Link to="/profile" className="orders-profile-back__link">
                <ArrowLeft size={20} />
                Back to profile
            </Link>
        </div>
    ) : null;

    if (isLoading) {
        return (
            <div className="orders-page-root">
                {backToProfileBar}
                <div className="orders-empty-state">
                    <div className="empty-icon-wrapper">
                        <Package size={64} style={{ opacity: 0.5 }} className="animate-spin" />
                    </div>
                    <h2>Loading orders...</h2>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="orders-page-root">
                {backToProfileBar}
                <div className="orders-empty-state">
                    <div className="empty-icon-wrapper">
                        <ShoppingBag size={64} strokeWidth={1} />
                    </div>
                    <h2>No orders yet</h2>
                    <p>Looks like you haven't made any purchases recently.</p>
                    <Link to="/discovery" className="back-shopping-btn">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page-root">
            {backToProfileBar}
            <div className="orders-page-container">
                <div className="orders-layout">
                    <aside className={`orders-sidebar ${selectedOrder ? 'hide-mobile' : ''}`}>
                        <div className="sidebar-header">
                            <h1>My Orders</h1>
                            <div className="search-bar">
                                <Search size={18} />
                                <input type="text" placeholder="Search order ID..." />
                            </div>
                        </div>

                        <div className="orders-list">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className={`order-preview-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="preview-top">
                                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                                        <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="preview-middle">
                                        <p className="item-preview">{order.items?.[0]?.product?.name || "Product"} {order.items?.length > 1 && `+${order.items.length - 1} more`}</p>
                                        <span className="order-amount">{Number(order.totalAmount)?.toLocaleString()} ETB</span>
                                    </div>
                                    <div className={`status-tag ${order.status.toLowerCase()}`}>
                                        {getStatusIcon(order.status)} {order.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <main className={`order-details-view ${!selectedOrder ? 'no-selection' : ''}`}>
                        {selectedOrder ? (
                            <div className="details-scroll">
                                <button className="mobile-back" onClick={() => setSelectedOrder(null)}>
                                    <ArrowLeft size={20} /> Back to List
                                </button>

                                <div className="details-header">
                                    <div className="id-group">
                                        <p className="label">Order Reference</p>
                                        <h2>{selectedOrder.id}</h2>
                                    </div>
                                    <button className="invoice-btn"><ExternalLink size={16} /> Get Invoice</button>
                                </div>

                                <div className="details-grid">
                                    <div className="details-main">
                                        <section className="section-card">
                                            <h3>Items Purchased</h3>
                                            <div className="items-container">
                                                {selectedOrder.items.map((item, idx) => (
                                                    <div key={idx} className="order-product-row">
                                                        <img src={item.product?.productImages?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'} alt="" />
                                                        <div className="prod-meta">
                                                            <h4>{item.product?.name}</h4>
                                                            <p>Unit Price: {Number(item.priceAtPurchase).toLocaleString()} ETB</p>
                                                        </div>
                                                        <span className="prod-qty">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="details-side">
                                        <section className="section-card">
                                            <h3>Shipping Info</h3>
                                            <div className="address-box">
                                                <div className="info-line">
                                                    <MapPin size={16} />
                                                    <span>{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}</span>
                                                </div>
                                                <div className="info-line">
                                                    <Phone size={16} />
                                                    <span>{selectedOrder.shippingPhone}</span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="section-card summary">
                                            <h3>Payment Summary</h3>
                                            <div className="price-row">
                                                <span>Total Amount Paid</span>
                                                <span className="big-price">{Number(selectedOrder.totalAmount)?.toLocaleString()} ETB</span>
                                            </div>
                                            {Number(selectedOrder.deliveryFeeAmount) > 0 && (
                                                <p className="orders-escrow-note">
                                                    Includes {Number(selectedOrder.deliveryFeeAmount).toLocaleString()} ETB delivery
                                                    (paid to courier after you confirm with the code).
                                                </p>
                                            )}
                                            <div className="payment-method-pill">
                                                <CreditCard size={14} /> Telebirr Transaction
                                            </div>
                                        </section>

                                        {selectedOrder.status === 'PROCESSING' &&
                                            selectedOrder.deliveryConfirmationCode && (
                                                <section className="section-card orders-handoff-banner">
                                                    <h3>Handoff code</h3>
                                                    <p className="orders-handoff-banner__hint">
                                                        Give this code to the courier — they enter it on their device to confirm
                                                        you received the order.
                                                    </p>
                                                    <div className="orders-handoff-banner__code">
                                                        {selectedOrder.deliveryConfirmationCode}
                                                    </div>
                                                </section>
                                            )}

                                        {selectedOrder.buyerConfirmedAt &&
                                            selectedOrder.disputeWindowEndsAt &&
                                            new Date(selectedOrder.disputeWindowEndsAt) > new Date() && (
                                                <section className="section-card orders-dispute-panel">
                                                    <h3>
                                                        <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                                        Dispute window
                                                    </h3>
                                                    <p className="orders-dispute-panel__until">
                                                        Until{' '}
                                                        {new Date(selectedOrder.disputeWindowEndsAt).toLocaleString()} you can
                                                        open a dispute. Seller payouts stay in escrow until this ends (if no
                                                        dispute).
                                                    </p>
                                                    <label className="orders-dispute-panel__label">Scope</label>
                                                    <select
                                                        className="orders-dispute-panel__select"
                                                        value={disputeScope}
                                                        onChange={(e) => setDisputeScope(e.target.value)}
                                                    >
                                                        <option value="order">Entire order</option>
                                                        {selectedOrder.items?.map((it) => (
                                                            <option key={it.id} value={it.id}>
                                                                One item: {it.product?.name?.slice(0, 40) || 'Item'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label className="orders-dispute-panel__label">What went wrong?</label>
                                                    <textarea
                                                        className="orders-dispute-panel__textarea"
                                                        rows={4}
                                                        value={disputeReason}
                                                        onChange={(e) => setDisputeReason(e.target.value)}
                                                        placeholder="At least 10 characters…"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="orders-dispute-panel__submit"
                                                        disabled={disputeMutation.isPending}
                                                        onClick={submitDispute}
                                                    >
                                                        Open dispute
                                                    </button>
                                                </section>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-details">
                                <Package size={48} />
                                <p>Select an order from the list to view its full details, status, and receipt.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Orders;