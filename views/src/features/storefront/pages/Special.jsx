import React from 'react';
import { Heart, Star, ShoppingCart, Gift, Sparkles, Clock, Share2 } from 'lucide-react';
import './Special.css';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { useWishlist } from '../hooks/useWishlist';

const Special = ({ ceremonyType, products }) => {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const themes = {
        valentine: {
            title: "Valentine's Collection",
            subtitle: "Express your love with the perfect gift.",
            accent: "#ff4d6d",
            secondary: "#fff0f3",
            icon: <Heart fill="#ff4d6d" stroke="none" />,
            bannerImg: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200"
        },
        mothersday: {
            title: "Mother's Day Special",
            subtitle: "For the one who does it all.",
            accent: "#9b5de5",
            secondary: "#f3e8ff",
            icon: <Sparkles color="#9b5de5" />,
            bannerImg: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1200"
        },
        eid: {
            title: "Eid Al-Fitr Deals",
            subtitle: "Celebrate with gifts for your family.",
            accent: "#006d77",
            secondary: "#edf6f9",
            icon: <Star fill="#006d77" stroke="none" />,
            bannerImg: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=1200"
        }
    };

    const activeTheme = themes[ceremonyType] || themes.valentine;

    return (
        <div className={`ceremony-page ${ceremonyType}`} style={{
            '--accent-color': activeTheme.accent,
            '--bg-secondary': activeTheme.secondary
        }}>
            <header className="ceremony-hero">
                <div className="hero-overlay"></div>
                <img src={activeTheme.bannerImg} alt="Banner" className="hero-bg" />

                <div className="hero-content">
                    <div className="ceremony-badge">
                        {activeTheme.icon}
                        <span>Limited Edition</span>
                    </div>
                    <h1>{activeTheme.title}</h1>
                    <p>{activeTheme.subtitle}</p>
                    <div className="hero-timer">
                        <Clock size={16} />
                        <span>Ending in 02d : 14h : 30m</span>
                    </div>
                </div>
            </header>

            <main className="ceremony-main">
                <div className="grid-header">
                    <h2>Handpicked for you</h2>
                    <button className="share-btn"><Share2 size={18} /> Share Collection</button>
                </div>

                <div className="ceremony-grid">
                    {products.map((product) => (
                        <div key={product.id} className="ceremony-card">
                            <div className="c-img-container">
                                <img src={product.img} alt={product.name} />
                                <div className="c-tag">Recommended</div>
                                <button
                                    type="button"
                                    className="c-wishlist"
                                    aria-label={product.id && isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    onClick={() => product.id && toggleWishlist(product.id)}
                                >
                                    <Heart
                                        size={18}
                                        fill={product.id && isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                        color={product.id && isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                    />
                                </button>
                            </div>

                            <div className="c-body">
                                <div className="c-rating">
                                    <Star size={12} fill="#ffb703" color="#ffb703" />
                                    <span>{product.rating}</span>
                                </div>
                                <h3 className="c-name">{product.name}</h3>
                                <p className="c-hover-desc">{product.description}</p>

                                <div className="c-footer">
                                    <div className="c-price-area">
                                        <span className="c-price">{unitProductPrice(product).toLocaleString()} ETB</span>
                                    </div>
                                    <button className="c-add-btn">
                                        <ShoppingCart size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Special;