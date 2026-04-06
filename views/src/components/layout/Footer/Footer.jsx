import './Footer.css'
import {
    Mail,
    Phone,
    MapPin,
    Send,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider.jsx'


const Footer = () => {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    return (
        <footer className='footer-container'>
            <div className="footer-newsletter">
                <div className="newsletter-text">
                    <h3>Join our Newsletter</h3>
                    <p>Get weekly updates on new arrivals and exclusive flash sales.</p>
                </div>
                <div className="newsletter-form">
                    <input type="email" placeholder="Enter your email address" />
                    <button className="newsletter-btn">
                        <span>Subscribe</span>
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <div className="footer-grid">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <img src="./eco.svg" alt="B-Mart" />
                        <span>B-Mart</span>
                    </div>
                    <p className="brand-desc">
                        Your trusted destination for quality products, global shipping, and 24/7 customer excellence.
                    </p>
                    <div className="contact-info">
                        <div className="contact-item">
                            <Phone size={16} /> <span>+251 911 000 000</span>
                        </div>
                        <div className="contact-item">
                            <Mail size={16} /> <span>support@b-mart.com</span>
                        </div>
                        <div className="contact-item">
                            <MapPin size={16} /> <span>Addis Ababa, Ethiopia</span>
                        </div>
                    </div>
                </div>

                <div className="footer-column">
                    <h4>SHOPPING</h4>
                    <ul>
                        <li><Link to="/categories">All Categories</Link></li>
                        <li><Link to="/flash-deals">Flash Deals</Link></li>
                        <li><Link to="/best-sellers">Best Sellers</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>SELL WITH US</h4>
                    <ul>
                        <li onClick={() => { isAuthenticated ? navigate("/apply-to-sell") : navigate("/login", { state: { from: "/apply-to-sell" } }) }}>
                            Apply to Sell
                        </li>
                        <li><Link to="/seller-policy">Seller Policy</Link></li>
                        <li><Link to="/shipping-partners">Shipping Partners</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>LEGAL</h4>
                    <ul>
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                        <li>Return Policy</li>
                    </ul>
                </div>

            </div>

            <div className='footer-bottom'>
                <div className="bottom-content">
                    <p>Copyright © 2026 B-Mart. All rights reserved.</p>
                    <div className="payment-methods">
                        <span>Visa</span>
                        <span>Mastercard</span>
                        <span>PayPal</span>
                        <span>Telebirr</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer