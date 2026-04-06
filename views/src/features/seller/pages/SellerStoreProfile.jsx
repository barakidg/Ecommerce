import { useState, useEffect } from "react";
import { Store, Shield, Wallet, Building2, CreditCard } from "lucide-react";
import {
    useSellerStoreProfile,
    useUpdateSellerStoreProfile
} from "../hooks/useSellerStoreProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { requestSellerPayout } from "../api/sellerApi.js";
import { formatEtb } from "../../../utils/formatEtb.js";
import "./SellerStoreProfile.css";

const statusLabel = (s) => {
    const m = {
        PENDING: "Under review",
        VERIFIED: "Verified",
        REJECTED: "Rejected",
        SUSPENDED: "Suspended"
    };
    return m[s] || s;
};

const SellerStoreProfile = () => {
    const { data, isLoading, isError, error } = useSellerStoreProfile();
    const updateProfile = useUpdateSellerStoreProfile();
    const queryClient = useQueryClient();

    const profile = data?.profile;
    const finances = data?.finances;

    const [form, setForm] = useState({
        businessName: "",
        taxId: "",
        paymentMethod: "",
        accountNumber: "",
        accountHolder: "",
        bankName: ""
    });
    const [payoutAmount, setPayoutAmount] = useState("");

    const payoutMutation = useMutation({
        mutationFn: requestSellerPayout,
        onSuccess: (resp) => {
            toast.success(resp?.message || "Payout requested");
            setPayoutAmount("");
            queryClient.invalidateQueries({ queryKey: ["sellerStoreProfile"] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || "Payout request failed");
        }
    });

    useEffect(() => {
        if (!profile) return;
        setForm({
            businessName: profile.businessName ?? "",
            taxId: profile.taxId ?? "",
            paymentMethod: profile.paymentMethod ?? "",
            accountNumber: profile.accountNumber ?? "",
            accountHolder: profile.accountHolder ?? "",
            bankName: profile.bankName ?? ""
        });
    }, [profile]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile.mutate(form);
    };

    const handlePayoutRequest = (e) => {
        e.preventDefault();
        const amount = Number(payoutAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Enter a valid payout amount");
            return;
        }
        payoutMutation.mutate({ amount, provider: "CHAPA" });
    };

    if (isLoading) {
        return (
            <div className="seller-profile-page">
                <p className="seller-profile-muted">Loading profile…</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="seller-profile-page">
                <div className="seller-profile-error-card">
                    <Shield size={28} />
                    <h2>Can&apos;t load store profile</h2>
                    <p>
                        {error?.response?.data?.message ||
                            "You may need a verified seller account."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="seller-profile-page">
            <header className="seller-profile-header">
                <div>
                    <span className="seller-profile-eyebrow">
                        <Store size={16} /> Store
                    </span>
                    <h1>Store profile</h1>
                    <p>How buyers and payouts see your business.</p>
                </div>
                <span
                    className={`seller-profile-status seller-profile-status--${(
                        profile?.status || ""
                    ).toLowerCase()}`}
                >
                    {statusLabel(profile?.status)}
                </span>
            </header>

            <div className="seller-profile-grid">
                <section className="seller-profile-card seller-profile-card--highlight">
                    <h2>
                        <Wallet size={20} /> Balance
                    </h2>
                    <p className="seller-profile-balance">
                        {formatEtb(finances?.balance ?? 0)}
                    </p>
                    <p className="seller-profile-muted">
                        Held: {formatEtb(finances?.heldBalance ?? 0)}
                    </p>
                    <form onSubmit={handlePayoutRequest} style={{ marginTop: 12 }}>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="Payout amount"
                            style={{ width: "100%", marginBottom: 8 }}
                        />
                        <button
                            type="submit"
                            className="seller-profile-save"
                            disabled={payoutMutation.isPending}
                            style={{ width: "100%" }}
                        >
                            {payoutMutation.isPending ? "Requesting..." : "Request payout"}
                        </button>
                    </form>
                </section>

                <section className="seller-profile-card">
                    <h2>
                        <Building2 size={20} /> Business details
                    </h2>
                    <dl className="seller-profile-dl">
                        <div>
                            <dt>Business name</dt>
                            <dd>{profile?.businessName || "—"}</dd>
                        </div>
                        <div>
                            <dt>Tax ID</dt>
                            <dd>{profile?.taxId || "—"}</dd>
                        </div>
                        <div>
                            <dt>Commission rate</dt>
                            <dd>
                                {profile?.commissionRate != null
                                    ? `${Number(profile.commissionRate) * 100}%`
                                    : "—"}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="seller-profile-card">
                    <h2>
                        <CreditCard size={20} /> Payout details
                    </h2>
                    <dl className="seller-profile-dl">
                        <div>
                            <dt>Method</dt>
                            <dd>{profile?.paymentMethod || "—"}</dd>
                        </div>
                        <div>
                            <dt>Bank</dt>
                            <dd>{profile?.bankName || "—"}</dd>
                        </div>
                        <div>
                            <dt>Account holder</dt>
                            <dd>{profile?.accountHolder || "—"}</dd>
                        </div>
                        <div>
                            <dt>Account number</dt>
                            <dd className="seller-profile-mono">
                                {profile?.accountNumber
                                    ? "•••• " + String(profile.accountNumber).slice(-4)
                                    : "—"}
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>

            {profile?.status === "VERIFIED" && (
                <form className="seller-profile-form card-surface" onSubmit={handleSave}>
                    <h2>Update payout & business info</h2>
                    <p className="seller-profile-muted">
                        Changes apply to your verified seller record.
                    </p>
                    <div className="seller-profile-form-grid">
                        <label>
                            Business name
                            <input
                                name="businessName"
                                value={form.businessName}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Tax ID
                            <input name="taxId" value={form.taxId} onChange={handleChange} />
                        </label>
                        <label>
                            Payment method
                            <input
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Bank name
                            <input
                                name="bankName"
                                value={form.bankName}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Account holder
                            <input
                                name="accountHolder"
                                value={form.accountHolder}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Account number
                            <input
                                name="accountNumber"
                                value={form.accountNumber}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="seller-profile-save"
                        disabled={updateProfile.isPending}
                    >
                        {updateProfile.isPending ? "Saving…" : "Save changes"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SellerStoreProfile;
