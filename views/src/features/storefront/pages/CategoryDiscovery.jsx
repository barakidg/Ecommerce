import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronDown, Star, ShoppingCart, Heart } from 'lucide-react';
import { useSearchProducts } from '../hooks/useSearchProducts';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useScrollRestore } from '../../../hooks/useScrollRestore.js';
import './CategoryDiscovery.css';

const CategoryDiscovery = () => {
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get('cat') || 'Electronics';
    const currentSub = searchParams.get('sub');

    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(null);
    const [sort, setSort] = useState('newest');

    const debouncedMaxPrice = useDebounce(maxPrice, 500);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useSearchProducts({
        categories: currentCategory,
        maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
        minRating,
        sort
    });

    const saveScroll = useScrollRestore(status === 'success');

    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const filteredProducts = data?.pages.flatMap(page => page.products) || [];

    return (
        <div className="discovery-wrapper">
            <header className="discovery-header">
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / <Link to="/categories">Categories</Link> / <span className="active">{currentCategory}</span>
                </div>
                <div className="header-flex">
                    <h1>{currentSub || currentCategory} <span className="count">({filteredProducts.length})</span></h1>
                    <div className="view-controls">
                        <div className="sort-dropdown">
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Sort by:</span>
                            <div className="select-wrapper">
                                <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
                                    <option value="newest">Newest</option>
                                    <option value="price-asc">Price</option>
                                </select>
                                <ChevronDown size={14} className="select-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="discovery-content">
                <aside className="filter-sidebar">
                    <div className="filter-group">
                        <h3>Price Range (ETB)</h3>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Customer Rating</h3>
                        {[4, 3, 2].map(star => (
                            <label key={star} className="check-item">
                                <input type="radio" name="rating" checked={minRating === star} onChange={() => setMinRating(star)} /> {star}★ & Up
                            </label>
                        ))}
                        <label className="check-item">
                            <input type="radio" name="rating" checked={minRating === null} onChange={() => setMinRating(null)} /> Any Rating
                        </label>
                    </div>
                </aside>

                <main className="product-grid">
                    {status === 'pending' ? (
                        <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1', color: '#64748b' }}>
                            Loading products...
                        </div>
                    ) : status === 'error' ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'red', gridColumn: '1 / -1' }}>
                            Failed to load products for this category.
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <>
                            {filteredProducts.map(product => {
                                const avgRating = product.reviews?.length
                                    ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1)
                                    : '0.0';

                                return (
                                    <div key={product.id} className="item-card">
                                        <div className="image-wrapper">
                                            <Link to={`/product/${product.id}`} state={{ from: 'Category Discovery' }} onClick={saveScroll}>
                                                <img src={product.productImages?.[0]?.url} alt={product.name} />
                                            </Link>
                                            <button
                                                type="button"
                                                className="quick-add-btn"
                                                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleWishlist(product.id);
                                                }}
                                            >
                                                <Heart
                                                    size={20}
                                                    fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                                    color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                                />
                                            </button>
                                        </div>
                                        <div className="item-info">
                                            <div className="info-top">
                                                <span className="rating"><Star size={12} fill="currentColor" /> {avgRating}</span>
                                                <span className="reviews">({product.reviews?.length || 0} reviews)</span>
                                            </div>
                                            <Link to={`/product/${product.id}`} state={{ from: 'Category Discovery' }} onClick={saveScroll} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h3 style={{ cursor: 'pointer' }}>{product.name}</h3>
                                            </Link>
                                            <p className="item-desc">{product.description}</p>
                                            <div className="info-bottom">
                                                <span className="price">{formatEtb(unitProductPrice(product))}</span>
                                                <button
                                                    className="add-to-cart-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        addToCart({ productId: product.id, quantity: 1 });
                                                    }}
                                                    disabled={isAdding}
                                                >
                                                    <ShoppingCart size={16} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasNextPage && (
                                <div className="load-more-area" style={{ gridColumn: '1 / -1', marginTop: '30px' }}>
                                    <button
                                        className="load-more-btn"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        style={{ display: 'block', margin: '0 auto' }}
                                    >
                                        {isFetchingNextPage ? 'Loading more...' : 'Load more products'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <ShoppingCart size={64} color="#CBD5E1" style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ textAlign: 'center' }}>No items found in this category</h3>
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Try adjusting your filters or browsing other groups.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CategoryDiscovery;