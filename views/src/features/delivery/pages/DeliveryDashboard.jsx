import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Truck, LogOut, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../auth/AuthProvider.jsx';
import {
    getDeliveryQueue,
    getDeliveryActive,
    acceptDeliveryOrder,
    confirmDeliveryHandoff,
    patchDeliveryAvailability,
    getDeliveryFinances,
    postDeliveryPayoutRequest,
    getDeliveryProfile,
    patchDeliveryPayoutProfile
} from '../api/deliveryApi.js';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
    const queryClient = useQueryClient();
    const { logout, user } = useAuth();
    const [handoffOrderId, setHandoffOrderId] = useState('');
    const [handoffCode, setHandoffCode] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [profileForm, setProfileForm] = useState({
        payoutMethod: '',
        payoutBankName: '',
        payoutAccountHolder: '',
        payoutAccountNumber: '',
        baseDeliveryFeeAmount: ''
    });

    const { data: profileData } = useQuery({
        queryKey: ['deliveryProfile'],
        queryFn: getDeliveryProfile,
        retry: false
    });

    const syncProfileForm = useCallback((profile) => {
        if (!profile) return;
        setProfileForm({
            payoutMethod: profile.payoutMethod || '',
            payoutBankName: profile.payoutBankName || '',
            payoutAccountHolder: profile.payoutAccountHolder || '',
            payoutAccountNumber: profile.payoutAccountNumber || '',
            baseDeliveryFeeAmount: profile.baseDeliveryFeeAmount ?? ''
        });
    }, []);

    const { data: queue = [], isLoading: queueLoading } = useQuery({
        queryKey: ['deliveryQueue'],
        queryFn: getDeliveryQueue,
        refetchInterval: 15_000
    });

    const { data: active = [], isLoading: activeLoading } = useQuery({
        queryKey: ['deliveryActive'],
        queryFn: getDeliveryActive,
        refetchInterval: 10_000
    });

    const { data: finances } = useQuery({
        queryKey: ['deliveryFinances'],
        queryFn: getDeliveryFinances,
        refetchInterval: 20_000
    });

    const available = profileData?.profile?.isAvailable ?? false;

    useEffect(() => {
        syncProfileForm(profileData?.profile);
    }, [profileData?.profile, syncProfileForm]);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['deliveryQueue'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryActive'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryFinances'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryProfile'] });
    }, [queryClient]);

    const toggleMutation = useMutation({
        mutationFn: () => patchDeliveryAvailability(!available),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryProfile'] });
            toast.success(!available ? 'You are now accepting orders.' : 'You are paused.');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not update availability')
    });

    const acceptMutation = useMutation({
        mutationFn: acceptDeliveryOrder,
        onSuccess: (data) => {
            toast.success(data.message || 'Order accepted');
            invalidateAll();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not accept order')
    });

    const handoffMutation = useMutation({
        mutationFn: ({ orderId, code }) => confirmDeliveryHandoff(orderId, code),
        onSuccess: (data) => {
            toast.success(data.message || 'Handoff confirmed');
            setHandoffCode('');
            setHandoffOrderId('');
            invalidateAll();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Invalid code or order state')
    });

    const payoutMutation = useMutation({
        mutationFn: postDeliveryPayoutRequest,
        onSuccess: (data) => {
            toast.success(data.message || 'Payout requested');
            setPayoutAmount('');
            queryClient.invalidateQueries({ queryKey: ['deliveryFinances'] });
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Payout request failed')
    });

    const saveProfileMutation = useMutation({
        mutationFn: patchDeliveryPayoutProfile,
        onSuccess: () => {
            toast.success('Payout profile updated');
            queryClient.invalidateQueries({ queryKey: ['deliveryProfile'] });
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Could not save payout profile')
    });

    const handlePayout = () => {
        const n = parseFloat(payoutAmount);
        if (!Number.isFinite(n) || n <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        payoutMutation.mutate({ amount: n });
    };

    const handleProfileSave = () => {
        const fee = Number(profileForm.baseDeliveryFeeAmount);
        saveProfileMutation.mutate({
            payoutMethod: profileForm.payoutMethod.trim(),
            payoutBankName: profileForm.payoutBankName.trim(),
            payoutAccountHolder: profileForm.payoutAccountHolder.trim(),
            payoutAccountNumber: profileForm.payoutAccountNumber.trim(),
            ...(Number.isFinite(fee) && fee >= 0 ? { baseDeliveryFeeAmount: fee } : {})
        });
    };

    return (
        <div className="dv-dash-page">
            <header className="dv-dash-header">
                <Link to="/" className="dv-dash-brand">
                    <Truck size={22} />
                    B-Mart <small>Courier</small>
                </Link>
                <div className="dv-dash-header-actions">
                    <span className="dv-dash-muted" style={{ marginRight: 8 }}>
                        {user?.name || user?.email}
                    </span>
                    <button
                        type="button"
                        className={`dv-dash-toggle ${!available ? 'dv-dash-toggle--off' : ''}`}
                        onClick={() => toggleMutation.mutate()}
                        disabled={toggleMutation.isPending}
                    >
                        {available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {available ? 'On duty' : 'Off duty'}
                    </button>
                    <button type="button" className="dv-dash-logout" onClick={() => logout()}>
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </header>

            <main className="dv-dash-main">
                <div className="dv-dash-card" style={{ marginBottom: 20 }}>
                    <h2>
                        <Wallet size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        Wallet
                    </h2>
                    <div className="dv-dash-wallet">
                        <div className="dv-dash-wallet-stat">
                            <span>Available</span>
                            <strong>{Number(finances?.balance ?? 0).toLocaleString()} ETB</strong>
                        </div>
                        <div className="dv-dash-wallet-stat">
                            <span>Held (accepted, awaiting buyer code)</span>
                            <strong>{Number(finances?.heldBalance ?? 0).toLocaleString()} ETB</strong>
                        </div>
                        <div className="dv-dash-wallet-stat">
                            <span>In payout hold</span>
                            <strong>{Number(finances?.payoutHoldBalance ?? 0).toLocaleString()} ETB</strong>
                        </div>
                    </div>
                    <div className="dv-dash-payout-row">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Amount"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                        />
                        <button
                            type="button"
                            className="dv-dash-btn-primary"
                            onClick={handlePayout}
                            disabled={payoutMutation.isPending}
                        >
                            Request payout
                        </button>
                    </div>
                    <p className="dv-dash-muted" style={{ marginTop: 12 }}>
                        Held balance increases when you accept deliveries and moves to Available when buyers confirm with code.
                    </p>
                    <div className="dv-dash-payout-profile">
                        <h2 style={{ marginBottom: 10 }}>Payout account & delivery fee settings</h2>
                        <div className="dv-dash-profile-grid">
                            <input
                                type="text"
                                placeholder="Payout method (bank/mobile)"
                                value={profileForm.payoutMethod}
                                onChange={(e) => setProfileForm((s) => ({ ...s, payoutMethod: e.target.value }))}
                            />
                            <input
                                type="text"
                                placeholder="Bank name"
                                value={profileForm.payoutBankName}
                                onChange={(e) => setProfileForm((s) => ({ ...s, payoutBankName: e.target.value }))}
                            />
                            <input
                                type="text"
                                placeholder="Account holder"
                                value={profileForm.payoutAccountHolder}
                                onChange={(e) => setProfileForm((s) => ({ ...s, payoutAccountHolder: e.target.value }))}
                            />
                            <input
                                type="text"
                                placeholder="Account number"
                                value={profileForm.payoutAccountNumber}
                                onChange={(e) => setProfileForm((s) => ({ ...s, payoutAccountNumber: e.target.value }))}
                            />
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Default delivery fee (ETB)"
                                value={profileForm.baseDeliveryFeeAmount}
                                onChange={(e) =>
                                    setProfileForm((s) => ({ ...s, baseDeliveryFeeAmount: e.target.value }))
                                }
                            />
                            <button
                                type="button"
                                className="dv-dash-btn-primary"
                                onClick={handleProfileSave}
                                disabled={saveProfileMutation.isPending}
                            >
                                Save payout details
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dv-dash-grid">
                    <div className="dv-dash-card">
                        <h2>
                            <Package size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                            Paid — awaiting courier
                        </h2>
                        {queueLoading ? (
                            <p className="dv-dash-muted">Loading…</p>
                        ) : queue.length === 0 ? (
                            <p className="dv-dash-muted">No orders in queue right now.</p>
                        ) : (
                            <div className="dv-dash-order-list">
                                {queue.map((order) => (
                                    <div key={order.id} className="dv-dash-order">
                                        <div className="dv-dash-order-meta">
                                            #{order.id.slice(0, 8)} ·{' '}
                                            {Number(order.deliveryFeeAmount || 0).toLocaleString()} ETB delivery fee
                                        </div>
                                        <div className="dv-dash-order-addr">
                                            <strong>{order.user?.name || 'Buyer'}</strong>
                                            <br />
                                            {order.shippingAddress}, {order.shippingCity},{' '}
                                            {order.shippingCountry}
                                            <br />
                                            {order.shippingPhone}
                                        </div>
                                        <div className="dv-dash-order-actions">
                                            <button
                                                type="button"
                                                className="dv-dash-btn-ghost"
                                                disabled={acceptMutation.isPending || !available}
                                                onClick={() => acceptMutation.mutate(order.id)}
                                            >
                                                Accept delivery
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="dv-dash-card">
                        <h2>
                            <Truck size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                            Your active runs
                        </h2>
                        {activeLoading ? (
                            <p className="dv-dash-muted">Loading…</p>
                        ) : active.length === 0 ? (
                            <p className="dv-dash-muted">No active deliveries. Accept one from the queue.</p>
                        ) : (
                            <div className="dv-dash-order-list">
                                {active.map((order) => (
                                    <div key={order.id} className="dv-dash-order">
                                        <div className="dv-dash-order-meta">#{order.id.slice(0, 8)}</div>
                                        <div className="dv-dash-order-addr">
                                            {order.shippingAddress}, {order.shippingCity}
                                            <br />
                                            {order.shippingPhone}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="dv-dash-handoff">
                            <h2 style={{ marginTop: 0 }}>Confirm handoff (buyer enters code here)</h2>
                            <label htmlFor="dv-handoff-order">Order</label>
                            <select
                                id="dv-handoff-order"
                                value={handoffOrderId}
                                onChange={(e) => setHandoffOrderId(e.target.value)}
                            >
                                <option value="">Select active order…</option>
                                {active.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        #{o.id.slice(0, 8)} — {o.shippingCity}
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="dv-handoff-code">6-digit code (from buyer&apos;s order screen)</label>
                            <input
                                id="dv-handoff-code"
                                value={handoffCode}
                                onChange={(e) => setHandoffCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                inputMode="numeric"
                            />
                            <button
                                type="button"
                                className="dv-dash-btn-primary"
                                disabled={handoffMutation.isPending || !handoffOrderId || handoffCode.length !== 6}
                                onClick={() =>
                                    handoffMutation.mutate({ orderId: handoffOrderId, code: handoffCode })
                                }
                            >
                                Verify & complete delivery
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DeliveryDashboard;
