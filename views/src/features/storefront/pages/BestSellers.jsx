import { Heart, Star, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { useScrollRestore } from '../../../hooks/useScrollRestore.js';
import './BestSellers.css';

const BestSellers = () => {
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useProducts({ sort: 'best-sellers' });

    const saveScroll = useScrollRestore(status === 'success');

    if (status === 'pending') {
        return (
            <div className="bestseller-page" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#64748b' }}>Loading Best Sellers...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="bestseller-page" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#ef4444' }}>Failed to load Best Sellers.</p>
            </div>
        );
    }

    const products = data?.pages?.flatMap(page => page?.products || []) || [];

    return (
        <div className="bestseller-page">
            <div className="bestseller-hero">
                <div className="hero-content">
                    <span className="badge-top"><TrendingUp size={14} /> Top Trending this month</span>
                </div>
            </div>

            <div className="bestseller-grid">
                {products.length > 0 ? (
                    products.map((product) => {
                        const avgRating = product.reviews?.length
                            ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1)
                            : '0.0';

                        return (
                            <div key={product.id} className="bs-item-card">
                                <div className="bs-image-area">
                                    <Link to={`/product/${product.id}`} state={{ from: 'Best Sellers' }} onClick={saveScroll}>
                                        <img src={product.productImages?.[0]?.url} alt={product.name} />
                                    </Link>

                                    <button
                                        type="button"
                                        className="bs-wishlist-btn"
                                        aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleWishlist(product.id);
                                        }}
                                    >
                                        <Heart
                                            size={16}
                                            fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                            color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                        />
                                    </button>
                                </div>

                                <div className="bs-card-info">
                                    <div className="bs-rating-row">
                                        <Star size={10} fill="#ff9900" color="#ff9900" />
                                        <span>{avgRating}</span>
                                    </div>

                                    <Link to={`/product/${product.id}`} state={{ from: 'Best Sellers' }} onClick={saveScroll} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 className="bs-product-name" style={{ cursor: 'pointer' }}>{product.name}</h3>
                                    </Link>

                                    <div className="bs-card-footer">
                                        <div className="bs-price-box">
                                            <span className="bs-currency">ETB</span>
                                            <span className="bs-amount">{unitProductPrice(product).toLocaleString()}</span>
                                        </div>
                                        <button
                                            className="bs-add-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                addToCart({ productId: product.id, quantity: 1 });
                                            }}
                                            disabled={isAdding}
                                        >
                                            <ShoppingCart size={14} />
                                            <span>Add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No best sellers found.
                    </div>
                )}
            </div>

            {hasNextPage && (
                <div className="load-more-area" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="load-more-btn"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        style={{
                            padding: '12px 24px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: '#475569'
                        }}
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load more items'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BestSellers;