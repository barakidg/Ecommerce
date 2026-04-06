import { useState } from 'react';
import {
    ShieldCheck,
    Truck,
    MapPin,
    Phone,
    ChevronRight,
    Lock,
    TicketPercent
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { useOrder } from '../hooks/useOrder';
import { toast } from 'react-hot-toast';
import './Checkout.css';

const CheckoutPage = () => {
    const [orderData, setOrderData] = useState({
        shippingAddress: '',
        shippingPhone: '',
        shippingCity: '',
        shippingCountry: 'Ethiopia',
    });

    const { cartItems } = useCart();
    const { createOrder, isCreating } = useOrder();

    const subtotal = cartItems.reduce((acc, item) => acc + Number(item.product?.price || 0) * item.quantity, 0);
    const discountedSubtotal = cartItems.reduce((acc, item) => acc + unitProductPrice(item.product) * item.quantity, 0);
    const discount = Math.max(0, subtotal - discountedSubtotal);
    const tax = discountedSubtotal * 0.15;
    const deliveryFee = Number(import.meta.env.VITE_PLATFORM_DELIVERY_FEE_ETB) || 50;
    const total = (subtotal - discount) + tax + deliveryFee;

    const handleInputChange = (e) => {
        setOrderData({ ...orderData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (!orderData.shippingAddress || !orderData.shippingPhone || !orderData.shippingCity) {
            toast.error("Please fill all shipping details");
            return;
        }

        try {
            const res = await createOrder({ ...orderData });
            if (res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-main">
                    <section className="checkout-section">
                        <div className="section-title">
                            <div className="step-num">1</div>
                            <h2>Shipping Destination</h2>
                        </div>

                        <div className="checkout-form">
                            <div className="input-grid">
                                <div className="input-group full">
                                    <label>Street Address</label>
                                    <div className="input-wrapper">
                                        <MapPin size={18} />
                                        <input
                                            name="shippingAddress"
                                            placeholder="House No, Street, Neighborhood (e.g. Bole Atlas)"
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>City</label>
                                    <input
                                        name="shippingCity"
                                        placeholder="Addis Ababa"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number</label>
                                    <div className="input-wrapper">
                                        <Phone size={18} />
                                        <input
                                            name="shippingPhone"
                                            placeholder="+251 9..."
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="secure-notice">
                        <Lock size={14} />
                        Your transaction is encrypted. You will continue securely on Chapa to complete payment.
                    </div>
                </div>

                <aside className="checkout-sidebar">
                    <div className="summary-sticky-card">
                        <h3>Order Summary</h3>

                        <div className="cart-preview">
                            {cartItems.map(item => (
                                <div key={item.id} className="mini-item">
                                    <img src={item.product?.productImages?.[0]?.url} alt="" />
                                    <div className="mini-details">
                                        <p className="mini-name">{item.product?.name}</p>
                                        <p className="mini-price">{item.quantity} × {unitProductPrice(item.product).toLocaleString()} ETB</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>{subtotal.toLocaleString()} ETB</span>
                            </div>
                            <div className="price-row">
                                <span>Tax (VAT 15%)</span>
                                <span>{tax.toLocaleString()} ETB</span>
                            </div>
                            <div className="price-row discount">
                                <span><TicketPercent size={14} /> Discount</span>
                                <span>-{discount.toLocaleString()} ETB</span>
                            </div>
                            <div className="price-row">
                                <span><Truck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Delivery (courier)</span>
                                <span>{deliveryFee.toLocaleString()} ETB</span>
                            </div>
                            <div className="price-divider"></div>
                            <div className="price-row total">
                                <span>Total</span>
                                <span>{total.toLocaleString()} ETB</span>
                            </div>
                        </div>

                        <button className="place-order-btn" onClick={handleCheckout} disabled={isCreating || cartItems.length === 0}>
                            {isCreating ? 'Processing...' : 'Complete Purchase'} <ChevronRight size={18} />
                        </button>

                        <div className="trust-badges">
                            <div className="badge"><ShieldCheck size={14} /> 100% Secure</div>
                            <div className="badge"><Truck size={14} /> Fast Shipping</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;