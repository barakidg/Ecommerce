import React from 'react';
import './Cart.css';
import './Wishlist.css';
import { Heart, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';

const Wishlist = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
    const { addToCart, isAdding } = useCart();

    if (!isAuthenticated) {
        return (
            <div className="empty-cart">
                <Heart size={80} />
                <h2>Sign in to view your wishlist</h2>
                <p>Save products you love and shop them later.</p>
                <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: '/wishlist' } })}
                    className="shop-now-btn"
                >
                    Sign in
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="cart-page-container" style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading wishlist…</h2>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="empty-cart">
                <Heart size={80} />
                <h2>Your wishlist is empty</h2>
                <p>Tap the heart on any product to save it here.</p>
                <button type="button" onClick={() => navigate('/')} className="shop-now-btn">
                    Browse products
                </button>
            </div>
        );
    }

    return (
        <div className="cart-page-container wishlist-page">
            <div className="cart-header">
                <button type="button" className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                    <span>Continue shopping</span>
                </button>
                <h1>
                    Wishlist <span className="item-count">({wishlistItems.length} items)</span>
                </h1>
            </div>

            <div className="wishlist-items-section">
                {wishlistItems.map((row) => {
                    const product = row.product;
                    if (!product) return null;
                    const img =
                        product.productImages?.[0]?.url ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                    return (
                        <div key={row.id} className="cart-item-card wishlist-item-card">
                            <Link to={`/product/${product.id}`} className="item-image wishlist-item-image">
                                <img src={img} alt={product.name} />
                            </Link>

                            <div className="item-details">
                                <div className="item-info">
                                    <span className="item-cat">{product.category || 'Product'}</span>
                                    <Link
                                        to={`/product/${product.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <h3>{product.name}</h3>
                                    </Link>
                                </div>

                                <div className="item-actions wishlist-item-actions">
                                    <button
                                        type="button"
                                        className="add-to-cart-btn wishlist-add-cart"
                                        onClick={() => addToCart({ productId: product.id, quantity: 1 })}
                                        disabled={isAdding}
                                    >
                                        <ShoppingCart size={16} />
                                        <span>Add to cart</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="remove-item-btn"
                                        title="Remove from wishlist"
                                        onClick={() => removeFromWishlist(product.id)}
                                    >
                                        <Trash2 size={18} />
                                        <span>Remove</span>
                                    </button>
                                </div>
                            </div>

                            <div className="item-price-block">
                                <span className="price-label">Price</span>
                                <span className="item-price">{formatEtb(unitProductPrice(product))}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Wishlist;
