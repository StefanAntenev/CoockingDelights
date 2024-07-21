import { Link } from 'react-router-dom';

export default function Footer() { 
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>About Us</h3>
                    <p>We are a leading company in providing the best services to our customers. Our goal is to ensure customer satisfaction through our high-quality products and exceptional service.</p>
                </div>
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/services">Services</Link></li>
                        <li><Link to="/contacts">Contacts</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3>Follow Us</h3>
                    <div className="social-links">
                        <a href="https://www.facebook.com/">Facebook</a>
                        <a href="https://x.com/?lang=en">Twitter</a>
                        <a href="https://www.instagram.com/">Instagram</a>
                        <a href="https://bg.linkedin.com/">LinkedIn</a>
                    </div>
                </div>
                <div className="footer-section">
                    <h3>Contact Us</h3>
                    <p>Email: info@example.com</p>
                    <p>Phone: +123 456 7890</p>
                    <p>Address: 123 Street Name, City, Country</p>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; 2024 Company Name. All rights reserved.
            </div>
        </footer>
    );
}