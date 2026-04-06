import { useMemo } from "react";
import {
    Package,
    User,
    MapPin,
    Calendar,
    ChevronRight
} from "lucide-react";
import { useSellerSales, useUpdateSaleStatus } from "../hooks/useSellerSales";
import { formatEtb } from "../../../utils/formatEtb.js";
import "./SellerOrders.css";

function groupSalesByOrder(sales) {
    const map = new Map();
    for (const item of sales) {
        const oid = item.orderId;
        if (!map.has(oid)) {
            map.set(oid, {
                orderId: oid,
                order: item.order,
                items: []
            });
        }
        map.get(oid).items.push(item);
    }
    return Array.from(map.values()).sort((a, b) =>
        String(b.orderId).localeCompare(String(a.orderId))
    );
}

const SellerOrders = () => {
    const { data, isLoading, isError, refetch, isFetching } = useSellerSales();

    const groups = useMemo(() => {
        const sales = data?.sales ?? [];
        return groupSalesByOrder(sales);
    }, [data?.sales]);

    return (
        <div className="seller-orders-page">
            <header className="seller-orders-hero">
                <div className="seller-orders-hero-text">
                    <span className="seller-orders-badge">
                        <Package size={14} /> Orders
                    </span>
                    <p>Every line item tied to your store. Update status as you ship.</p>
                </div>
                <button
                    type="button"
                    className="seller-orders-refresh"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? "Refreshing…" : "Refresh"}
                </button>
            </header>

            {isLoading && (
                <div className="seller-orders-empty">Loading orders…</div>
            )}
            {isError && (
                <div className="seller-orders-empty seller-orders-error">
                    Could not load orders.
                </div>
            )}
            {!isLoading && !isError && groups.length === 0 && (
                <div className="seller-orders-empty">No orders yet.</div>
            )}

            <div className="seller-orders-grid">
                {groups.map((group) => (
                    <article key={group.orderId} className="seller-order-card">
                        <div className="seller-order-card-top">
                            <div>
                                <span className="seller-order-id">
                                    Order #{group.orderId.slice(0, 8)}
                                </span>
                                <div className="seller-order-meta">
                                    <span>
                                        <User size={14} />
                                        {group.order?.user?.name || "Customer"}
                                    </span>
                                    <span>
                                        <Calendar size={14} />
                                        {group.order?.createdAt
                                            ? new Date(
                                                group.order.createdAt
                                            ).toLocaleDateString()
                                            : "—"}
                                    </span>
                                    <span>
                                        <MapPin size={14} />
                                        {[
                                            group.order?.shippingCity,
                                            group.order?.shippingCountry
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || "—"}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="seller-order-chevron" size={20} />
                        </div>

                        <ul className="seller-order-lines">
                            {group.items.map((line) => (
                                <li key={line.id} className="seller-order-line">
                                    <div className="seller-order-line-product">
                                        <div className="seller-order-thumb-wrap">
                                            {line.product?.productImages?.[0]?.url ? (
                                                <img
                                                    src={
                                                        line.product
                                                            .productImages[0].url
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <Package size={22} />
                                            )}
                                        </div>
                                        <div>
                                            <strong>{line.product?.name}</strong>
                                            <span className="seller-order-qty">
                                                Qty {line.quantity} ×{" "}
                                                {formatEtb(line.priceAtPurchase)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="seller-order-line-total">
                                        {formatEtb(
                                            Number(line.priceAtPurchase) *
                                            line.quantity
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default SellerOrders;
