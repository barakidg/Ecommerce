import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useProductDetails } from '../hooks/useProductDetails';
import { useSearchProducts } from '../hooks/useSearchProducts';
import { useAddReview } from '../hooks/useAddReview';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';
import './ProductDetails.css';
import {
    Star, ShoppingCart, ShieldCheck, Truck, RotateCcw,
    Plus, Minus, Heart, Share2, MessageCircle, ArrowLeft
} from 'lucide-react';

const ProductDetail = () => {
    const { productId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedImg, setSelectedImg] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    const { isAuthenticated } = useAuth();
    const addReviewMutation = useAddReview();

    const { data: product, isLoading, isError } = useProductDetails(productId);
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const { data: similarData } = useSearchProducts({
        categories: product?.category,
        enabled: !!product?.category
    });

    const handleReviewSubmit = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (!reviewText.trim()) return;

        addReviewMutation.mutate(
            { productId: product.id, rating: reviewRating, comment: reviewText },
            {
                onSuccess: () => {
                    setReviewText('');
                    setReviewRating(5);
                }
            }
        );
    };

    const similarProducts = useMemo(() => {
        const prodList = similarData?.pages?.[0]?.products || [];
        if (!prodList.length) return [];
        return [...prodList]
            .filter(p => p.id !== productId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
    }, [similarData?.pages, productId]);

    if (isLoading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading product details...</div>;
    }

    if (isError || !product) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>Failed to load product.</div>;
    }

    const listPrice = Number(product.price);
    const unit = unitProductPrice(product);
    const onSale = unit < listPrice;
    const fallbackImg = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
    const images =
        product.productImages?.length > 0
            ? product.productImages.map((img) => img.url)
            : [fallbackImg];

    const reviewCount = product.reviews?.length || 0;
    const avgRating = reviewCount > 0
        ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1)
        : '0.0';


    return (
        <div className="product-page">
            {location.state?.from && (
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '10px 0 20px',
                        color: '#64748b',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'color 0.2s',
                        width: 'fit-content'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#001e2b'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                >
                    <ArrowLeft size={16} /> Back to {location.state.from}
                </button>
            )}
            <div className="product-main-container">
                <div className="product-gallery">
                    <div className="thumbnail-list">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className={`thumb-item ${selectedImg === index ? 'active' : ''}`}
                                onClick={() => setSelectedImg(index)}
                            >
                                <img src={img} alt="Thumbnail" />
                            </div>
                        ))}
                    </div>
                    <div className="main-image">
                        <img src={images[selectedImg] || images[0]} alt="Product Main" />
                        <button
                            type="button"
                            className="wishlist-float"
                            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            onClick={() => toggleWishlist(product.id)}
                        >
                            <Heart
                                size={20}
                                fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                            />
                        </button>
                    </div>
                </div>

                <div className="product-info-section">
                    <div className="info-header">
                        <span className="brand-tag">{product.sellerProfile?.businessName || "Item Details"}</span>
                        <h1>{product.name}</h1>
                        <div className="rating-row">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.round(Number(avgRating)) ? "#ff9900" : "none"} color="#ff9900" />)}
                                <span>({avgRating})</span>
                            </div>
                            <span className="review-link">{reviewCount} Reviews</span>
                        </div>
                    </div>

                    <div className="price-block">
                        {onSale && (
                            <div className="old-price" style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1rem', marginBottom: 4 }}>
                                {formatEtb(listPrice)}
                            </div>
                        )}
                        <div className="current-price">{formatEtb(unit)}</div>
                        {onSale && (
                            <span className="save-badge" style={{ marginLeft: 8, fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                                Save {formatEtb(listPrice - unit)}
                            </span>
                        )}
                    </div>

                    <p className="description">{product.description}</p>

                    <div className="specs-grid">
                        <div className="spec-tag">Category: {product.category}</div>
                        <div className="spec-tag">Stock: {product.stock} left</div>
                    </div>

                    {product.attributes &&
                        typeof product.attributes === 'object' &&
                        !Array.isArray(product.attributes) &&
                        Object.keys(product.attributes).length > 0 && (
                            <div className="product-attributes-block">
                                <h3 className="product-attributes-title">Specifications</h3>
                                <ul className="product-attributes-list">
                                    {Object.entries(product.attributes).map(([key, val]) => (
                                        <li key={key} className="product-attribute-row">
                                            <span className="product-attribute-key">{key}</span>
                                            <span className="product-attribute-val">
                                                {String(val)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    <div className="purchase-actions">
                        <div className="qty-selector">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={18} /></button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)}><Plus size={18} /></button>
                        </div>
                        <button
                            className="add-to-cart-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                addToCart({ productId: product.id, quantity: quantity });
                            }}
                            disabled={isAdding}
                        >
                            <ShoppingCart size={20} />
                            {isAdding ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>

                    <div className="trust-badges">
                        <div className="badge-item"><Truck size={18} /> <span>Fast Delivery in 24h</span></div>
                        <div className="badge-item"><RotateCcw size={18} /> <span>7 Days Return</span></div>
                    </div>
                </div>
            </div>

            {similarProducts.length > 0 && (
                <div className="similar-products-section" style={{ marginTop: '40px' }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#0f172a' }}>Similar Products</h2>
                    <div className="discovery-content" style={{ display: 'block' }}>
                        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {similarProducts.map(sim => (
                                <div key={sim.id} className="item-card">
                                    <div className="image-wrapper">
                                        <Link to={`/product/${sim.id}`}>
                                            <img src={sim.productImages?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} alt={sim.name} />
                                        </Link>
                                        <button
                                            type="button"
                                            className="quick-add-btn"
                                            aria-label={isInWishlist(sim.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleWishlist(sim.id);
                                            }}
                                        >
                                            <Heart
                                                size={20}
                                                fill={isInWishlist(sim.id) ? '#ff4d6d' : 'none'}
                                                color={isInWishlist(sim.id) ? '#ff4d6d' : 'currentColor'}
                                            />
                                        </button>
                                    </div>
                                    <div className="item-info">
                                        <Link to={`/product/${sim.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <h3 style={{ fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sim.name}</h3>
                                        </Link>
                                        <div className="info-bottom" style={{ marginTop: '10px' }}>
                                            <span className="price" style={{ fontSize: '15px' }}>{formatEtb(unitProductPrice(sim))}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <section className="reviews-container">
                <div className="reviews-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <h2>Customer Reviews</h2>

                    <div className="inline-review-form" style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '600px', background: '#f8fafc', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="star-selector" style={{ display: 'flex', gap: '2px', cursor: 'pointer' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    size={18}
                                    fill={star <= reviewRating ? "#ff9900" : "none"}
                                    color={star <= reviewRating ? "#ff9900" : "#cbd5e1"}
                                    onClick={() => setReviewRating(star)}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder={isAuthenticated ? "Write your review here..." : "Sign in to write a review..."}
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            onFocus={() => {
                                if (!isAuthenticated) navigate('/login', { state: { from: location.pathname } });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleReviewSubmit();
                            }}
                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#334155' }}
                        />
                        <button
                            onClick={handleReviewSubmit}
                            disabled={addReviewMutation.isPending || !reviewText.trim()}
                            style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            {addReviewMutation.isPending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>

                <div className="reviews-grid">
                    {reviewCount > 0 ? (
                        product.reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="reviewer-info">
                                    <div className="avatar">{review.user?.name?.[0] || "U"}</div>
                                    <div>
                                        <strong>{review.user?.name || "User"}</strong>
                                        <div className="stars">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "#ff9900" : "none"} color="#ff9900" />)}
                                        </div>
                                    </div>
                                </div>
                                <p>{review.comment}</p>
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#64748b' }}>No reviews yet. Be the first to review this product!</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ProductDetail;