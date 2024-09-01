import "../assets/styles/Home.css";

import { useNavigate, useLocation, Link } from "react-router-dom";
import React, { useContext, useState, useEffect, useCallback } from "react";

function Home() {
    const navigate = useNavigate();
    const [leetcodeUsername, setLeetcodeUsername] = useState('');

  const handleInputChange = (e) => {
    setLeetcodeUsername(e.target.value);
  };

  return (
    <div className="home-container">
      <div className="user-section">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter Leetcode Username"
            value={leetcodeUsername}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>
        <div className="user-profile">
          <img
            src="https://via.placeholder.com/80" // Placeholder user logo, replace with dynamic
            alt="User Logo"
            className="user-logo"
          />
          <span className="username">Your Name</span>
        </div>
      </div>

      <div className="services-section">
        <h2>Services</h2>
        <ul className="services-list">
          <li className="service-item" onClick={() => navigate('/gamam150')}>150 days : Cracking the GAMAM Technical Interview</li>
          <li className="service-item" onClick={() => window.location.href = '/service2'}>Service 2</li>
          <li className="service-item" onClick={() => window.location.href = '/service3'}>Service 3</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;