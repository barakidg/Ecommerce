import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, Star, Heart, ShoppingCart,
    ChevronDown, SlidersHorizontal, X, LayoutGrid, List
} from 'lucide-react';
import './Searches.css';
import { useSearchProducts } from '../hooks/useSearchProducts';
import { useDebounce } from '../../../hooks/useDebounce';
import { useScrollRestore } from '../../../hooks/useScrollRestore';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';

const SearchResults = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const q = (searchParams.get('q') || '').trim();
    const hasQuery = q.length > 0;

    const [viewType, setViewType] = useState('grid');

    const [categories, setCategories] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [rating, setRating] = useState(null);
    const [sort, setSort] = useState('relevance');

    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };

        if (isSortOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSortOpen]);

    const debouncedCategories = useDebounce(categories, 500);
    const debouncedMinPrice = useDebounce(minPrice, 500);
    const debouncedMaxPrice = useDebounce(maxPrice, 500);
    const debouncedRating = useDebounce(rating, 500);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useSearchProducts({
        q,
        categories: debouncedCategories.join(','),
        minPrice: debouncedMinPrice,
        maxPrice: debouncedMaxPrice,
        minRating: debouncedRating,
        sort,
        enabled: hasQuery
    });

    const saveScroll = useScrollRestore(hasQuery && !isLoading);

    const products = data?.pages.flatMap(page => page.products) || [];
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handleCategoryChange = (cat) => {
        setCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSort = (type) => {
        setSort(type);
        setIsSortOpen(false);
    };

    const sortLabels = {
        'relevance': 'Relevance',
        'price-desc': 'Price: High to Low',
        'price-asc': 'Price: Low to High',
        'newest': 'Newest Arrivals'
    };

    return (
        <div className="search-results-page">
            <header className="search-header">
                <div className="search-info">
                    <h1>
                        {hasQuery ? (
                            <>Results for <span>&quot;{q}&quot;</span></>
                        ) : (
                            <>Search products</>
                        )}
                    </h1>
                    <p>
                        {hasQuery
                            ? `${products.length} item${products.length === 1 ? '' : 's'} shown`
                            : 'Enter a search term in the header to find products.'}
                    </p>
                </div>

                <div className="view-controls">
                    <div className="sort-dropdown" style={{ position: 'relative' }} ref={sortDropdownRef}>
                        <span style={{ fontSize: '12px', color: '#64748b', marginRight: '5px' }}>Sort by:</span>
                        <button onClick={() => setIsSortOpen(!isSortOpen)}>
                            {sortLabels[sort]} <ChevronDown size={14} />
                        </button>
                        {isSortOpen && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10, minWidth: '150px', marginTop: '5px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                {Object.entries(sortLabels).map(([key, label]) => (
                                    <div key={key} onClick={() => handleSort(key)} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', background: sort === key ? '#f1f5f9' : 'transparent', fontSize: '13px', fontWeight: sort === key ? '700' : '500' }}>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="toggle-view">
                        <button className={viewType === 'grid' ? 'active' : ''} onClick={() => setViewType('grid')}><LayoutGrid size={18} /></button>
                        <button className={viewType === 'list' ? 'active' : ''} onClick={() => setViewType('list')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            <div className="searches-main-container">
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <h3>Category</h3>
                        <div className="filter-options">
                            {['Electronics', 'Audio', 'Wearables', 'Fashion', 'Home', 'Beauty'].map(cat => (
                                <label key={cat}>
                                    <input
                                        type="checkbox"
                                        checked={categories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Price Range (ETB)</h3>
                        <div className="price-inputs">
                            <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                            <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Rating</h3>
                        {[4, 3, 2, 1].map(num => (
                            <label key={num} className="rating-label">
                                <input type="radio" name="rating" checked={rating === num} onChange={() => setRating(num)} />
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill={i < num ? "#ff9900" : "none"} color={i < num ? "#ff9900" : "#cbd5e1"} />
                                    ))}
                                    <span>& Up</span>
                                </div>
                            </label>
                        ))}
                        <label className="rating-label" style={{ marginTop: '10px', fontSize: '13px', cursor: 'pointer', color: '#ff9900' }} onClick={() => setRating(null)}>Clear Rating</label>
                    </div>
                </aside>

                <main className={`results-display ${viewType}`}>
                    {!hasQuery ? (
                        <p style={{ gridColumn: '1 / -1', padding: '20px', color: '#64748b' }}>
                            Use the search bar above to look up products by name, category, description, or store name.
                        </p>
                    ) : isLoading ? (
                        <p style={{ gridColumn: '1 / -1', padding: '20px' }}>Loading products...</p>
                    ) : isError ? (
                        <p style={{ gridColumn: '1 / -1', padding: '20px', color: '#ef4444' }}>Something went wrong loading results. Please try again.</p>
                    ) : products.length === 0 ? (
                        <p style={{ gridColumn: '1 / -1', padding: '20px' }}>No products match your search criteria.</p>
                    ) : (
                        products.map((product, index) => {
                            const isLast = products.length === index + 1;
                            const mainImg = product.productImages?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400";
                            const avgRating = product.reviews?.length
                                ? (product.reviews.reduce((a, c) => a + c.rating, 0) / product.reviews.length).toFixed(1)
                                : "0.0";

                            return (
                                <div
                                    key={product.id}
                                    className="search-item-card"
                                    ref={isLast ? lastElementRef : null}
                                >
                                    <div className="search-img-area" onClick={() => { saveScroll(); navigate(`/product/${product.id}`, { state: { from: 'Search Results' } }); }} style={{ cursor: 'pointer' }}>
                                        <img src={mainImg} alt={product.name} />
                                        <button
                                            type="button"
                                            className="search-wish-btn"
                                            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist(product.id);
                                            }}
                                        >
                                            <Heart
                                                size={18}
                                                fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                                color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                            />
                                        </button>
                                    </div>

                                    <div className="search-card-body">
                                        <div className="search-rating">
                                            <Star size={10} fill="#ff9900" color="#ff9900" />
                                            <span>{avgRating}</span>
                                        </div>
                                        <h3 className="search-prod-name" onClick={() => { saveScroll(); navigate(`/product/${product.id}`, { state: { from: 'Search Results' } }); }} style={{ cursor: 'pointer' }}>{product.name}</h3>

                                        <div className="search-card-footer">
                                            <span className="search-price">{unitProductPrice(product).toLocaleString()} ETB</span>
                                            <button className="search-add-btn" onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart({ productId: product.id, quantity: 1 });
                                            }}>
                                                <ShoppingCart size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isFetchingNextPage && <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>Loading more...</p>}
                </main>
            </div>
        </div>
    );
};

export default SearchResults;