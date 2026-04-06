import './Cart.css';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, isLoading, updateCartItem, removeFromCart } = useCart();

    if (isLoading) {
        return (
            <div className="cart-page-container" style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading cart...</h2>
            </div>
        );
    }

    const subtotal = cartItems.reduce((acc, item) => acc + unitProductPrice(item.product) * item.quantity, 0);
    const shipping = 200;
    const total = subtotal + shipping;

    if (cartItems.length === 0) {
        return (
            <div className="empty-cart">
                <ShoppingBag size={80} />
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything yet.</p>
                <button onClick={() => navigate('/')} className="shop-now-btn">Start Shopping</button>
            </div>
        );
    }

    const handleQuantityChange = (productId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity > 0) {
            updateCartItem({ productId, quantity: newQuantity });
        }
    };

    return (
        <div className="cart-page-container">
            <div className="cart-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                    <span>Continue Shopping</span>
                </button>
                <h1>Shopping Cart <span className="item-count">({cartItems.length} items)</span></h1>
            </div>

            <div className="cart-content">
                <div className="cart-items-section">
                    {cartItems.map((item) => {
                        const product = item.product;
                        return (
                            <div key={item.id} className="cart-item-card">
                                <div className="item-image">
                                    <img src={product.productImages?.[0]?.url} alt={product.name} />
                                </div>

                                <div className="item-details">
                                    <div className="item-info">
                                        <span className="item-cat">{product.category || 'Category'}</span>
                                        <h3>{product.name}</h3>
                                    </div>

                                    <div className="item-actions">
                                        <div className="quantity-control">
                                            <button
                                                className="qty-btn"
                                                onClick={() => handleQuantityChange(product.id, item.quantity, -1)}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => handleQuantityChange(product.id, item.quantity, 1)}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <button
                                            className="remove-item-btn"
                                            title="Remove Item"
                                            onClick={() => removeFromCart(product.id)}
                                        >
                                            <Trash2 size={18} />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="item-price-block">
                                    <span className="price-label">Price</span>
                                    <span className="item-price">{formatEtb(unitProductPrice(product) * item.quantity)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <aside className="cart-summary-section">
                    <div className="summary-card">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatEtb(subtotal)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>{formatEtb(shipping)}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>{formatEtb(total)}</span>
                        </div>

                        <button className="checkout-btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>

                        <div className="secure-info">
                            <span className="icon">🔒</span>
                            <span>Secure Checkout Protected</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Cart;