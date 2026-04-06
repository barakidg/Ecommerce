import { Link } from "react-router-dom";
import {
    DollarSign,
    ShoppingBag,
    Package,
    AlertTriangle,
    MoreHorizontal
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useSellerDashboard } from "../hooks/useSellerDashboard";
import { formatEtb } from "../../../utils/formatEtb.js";

const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "delivered";
    if (s === "shipped") return "shipped";
    if (s === "processing" || s === "confirmed") return "processing";
    if (s === "cancelled" || s === "refunded") return "cancelled";
    return "pending";
};

const SellerDashboard = () => {
    const { user } = useAuth();
    const { data, isLoading, isError } = useSellerDashboard();

    const stats = data?.stats;
    const recentSales = data?.recentSales ?? [];

    const statCards = stats
        ? [
            {
                id: 1,
                label: "Total sales",
                value: formatEtb(stats.totalRevenue),
                icon: <DollarSign />
            },
            {
                id: 2,
                label: "Active orders",
                value: String(stats.activeOrders),
                icon: <ShoppingBag />
            },
            {
                id: 3,
                label: "Products live",
                value: String(stats.productCount),
                icon: <Package />
            },
            {
                id: 4,
                label: "Low stock (≤10)",
                value: String(stats.lowStockCount),
                icon: <AlertTriangle />
            }
        ]
        : [];

    return (
        <div className="dashboard-content">
            <header className="dashboard-greet">
                <div>
                    <h1>Welcome back, {user?.name || "Seller"}!</h1>
                    <p>Here is what&apos;s happening with your store today.</p>
                </div>
                <button type="button" className="export-btn" disabled>
                    Download Report
                </button>
            </header>

            <div className="seller-dash-stats">
                {isLoading && (
                    <p className="seller-dash-stats__message">Loading stats…</p>
                )}
                {isError && (
                    <p className="seller-dash-stats__message seller-dash-stats__message--error">
                        Could not load dashboard data.
                    </p>
                )}
                {!isLoading &&
                    !isError &&
                    statCards.map((stat) => (
                        <div key={stat.id} className="seller-dash-stat">
                            <div className="seller-dash-stat__icon-wrap">
                                <div className="seller-dash-stat__icon">{stat.icon}</div>
                            </div>
                            <div className="seller-dash-stat__body">
                                <h3 className="seller-dash-stat__value">{stat.value}</h3>
                                <p className="seller-dash-stat__label">{stat.label}</p>
                            </div>
                        </div>
                    ))}
            </div>

            <div className="dashboard-main-grid">
                <div className="orders-container card-surface">
                    <div className="card-header">
                        <h2>Recent Orders</h2>
                    </div>
                    {isLoading ? (
                        <p style={{ color: "#64748b", padding: "20px" }}>Loading…</p>
                    ) : recentSales.length === 0 ? (
                        <p style={{ color: "#64748b", padding: "20px" }}>No orders yet.</p>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.map((item) => (
                                    <tr key={item.id}>
                                        <td className="order-id">
                                            #{item.order?.id?.slice(0, 8) ?? "—"}
                                        </td>
                                        <td>{item.order?.user?.name || "Customer"}</td>
                                        <td>{item.product?.name ?? "—"}</td>
                                        <td>
                                            <span
                                                className={`status-pill ${statusClass(
                                                    item.status
                                                )}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="order-amount">
                                            {formatEtb(
                                                Number(item.priceAtPurchase) *
                                                item.quantity
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="top-products card-surface">
                    <div className="card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="action-list">
                        <Link to="/seller/add-product">
                            <button type="button" className="action-item">
                                Add New Product
                            </button>
                        </Link>
                        <Link to="/seller/products">
                            <button type="button" className="action-item outline">
                                Manage Inventory
                            </button>
                        </Link>
                        <Link to="/seller/profile">
                            <button type="button" className="action-item outline">
                                Store Profile
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
