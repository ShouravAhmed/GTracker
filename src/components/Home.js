import "../assets/styles/Home.css";

import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
        <h1 className="home-title">Cracking the GAMAM Technical Interview</h1>
        
        <div className="home-row" onClick={() => navigate('gamam-150')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('coding')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('system-design')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('object-oriented-design')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('schema-design')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('api-design')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>

        <div className="home-row" onClick={() => navigate('behavioral')}>
          <span className="home-item-no">1</span>
          <span className="home-item-url">GAMAM 150 days Tracker.</span>          
        </div>
    </div>
  );
}

export default Home;