import React from "react";
import "./flyer.css";
import { FaStore, FaTags, FaLink, FaDollarSign } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";

const FlyerPage = () => {
  return (
    <div className="flyer-container">

      {/* Header */}
      <div className="flyer-header">
        <div className="brand">Shop<span>Dot</span></div>
        <h2 className="your-logo">YOUR LOGO</h2>
      </div>

      {/* Title */}
      <h1 className="title">We're Now on ShopDot!</h1>

      <p className="subtitle">
        Create your own storefront and sell our products—
        <br />
        no inventory, no upfront costs
      </p>

      {/* CTA Button */}
      <button className="cta-btn">
        Launch your free storefront in minutes:
        <br />
        <strong>joinshopdot.com/invite/purina</strong>
      </button>

      <p className="partner-text">
        Partner with us through ShopDot, a platform designed to help you
        generate extra income by selling the products you already recommend.
      </p>

      <h3 className="section-title">With ShopDot, you can:</h3>

      {/* Feature Cards */}
      <div className="features">

        <div className="card">
          <FaStore className="icon" />
          <p>Launch your free storefront in minutes</p>
        </div>

        <div className="card">
          <FaTags className="icon" />
          <p>Curate the brands and products your clients will love</p>
        </div>

        <div className="card">
          <FaLink className="icon" />
          <p>Share your storefront link so customers can purchase directly</p>
        </div>

        <div className="card">
          <FaDollarSign className="icon" />
          <p>Earn commission on every sale—we handle fulfillment</p>
        </div>

      </div>

      {/* QR Section */}
      <div className="qr-section">
        <QRCodeCanvas
          value="https://joinshopdot.com/invite/purina"
          size={140}
        />

        <p className="qr-link">
          joinshopdot.com/invite/purina
        </p>

        <p className="footer-links">
          www.shopdotpet.com | info@shopdotapp.com
        </p>
      </div>

    </div>
  );
};

export default FlyerPage;
