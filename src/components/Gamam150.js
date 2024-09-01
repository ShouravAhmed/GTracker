import "../assets/styles/Gamam150.css";

import React, { useContext, useState, useEffect, useCallback } from "react";

import gamamJson from "../assets/json/gamam150.json";

function Gamam150() {

    const [codingProblems, setCodingProblems] = useState({});
    const [problemStatusToggle, setProblemStatusToggle] = useState(false);
    
    const fetchCodingProblems = () => {
        const data = {};
        
        for (var item of gamamJson.Coding) {
            if (!('day' in item)) continue;
            item['type'] = 'Coding';

            if (!(item.day in data)) data[item.day] = [];
            data[item.day].push(item);
        }
        setCodingProblems(data);
    };
    
    useEffect(() => {
        fetchCodingProblems();
    }, []);

    const isDayCompleted = (day) => {
      const problems = codingProblems[day];
      
      var cnt = 0;
      for(const problem of problems) {
        const status = localStorage.getItem(problem.name);
        if(status === 'true') cnt += 1;
      }
      return cnt === problems.length;
    }

    const isProblemSolved = (problemName) => {
      const status = localStorage.getItem(problemName);
      return (status === 'true' ? true : false);
    }

    const updateProblemStatus = (problemName) => {
      const status = localStorage.getItem(problemName);
    
      // Toggle between true and false strings
      const newStatus = status === "true" ? "false" : "true";
      
      console.log('New Status:', newStatus);
    
      // Store the new status in localStorage as a string
      localStorage.setItem(problemName, newStatus);
      setProblemStatusToggle(!problemStatusToggle);
    };
    const totalSolved = Object.keys(localStorage).filter(key => localStorage.getItem(key) === 'true').length;
    const daysCompleted = Object.keys(codingProblems).filter(day => isDayCompleted(day)).length;

  return (
    <div className="gamam-tracker">
        <h1 className="title">GAMAM 150 Day Tracker</h1>
      
        <div className="summary-row">
          <div className="summary-item left">
            <span>Day Completed</span>
            <strong>{daysCompleted}</strong>
          </div>
          <div className="summary-item right">
            <span>Total Solved</span>
            <strong>{totalSolved}</strong>
          </div>
        </div>

        <div className="day-list">
        {Object.entries(codingProblems).map(([day, problems]) => (
          <div className="problem-list">
            <div className="day-title-block">
              <span className="day-title">Day {parseInt(day) + 1}</span>
              <span className={`day-status ${isDayCompleted(day) ? "completed" : "pending"}`}>
                {isDayCompleted(day) ? "Completed" : "Pending"}
              </span>
            </div>
            {problems.map((problem, problemNo) => (
                <div className="problem-row">
                  <span className="problem-no">{problemNo}</span>
                  <a className="problem-url" href={problem.url} target="_blank" rel="noopener noreferrer">{problem.name}</a>
                  <span className={`problem-difficulty ${problem.difficulty === '(Easy)' ? "easy" : (problem.difficulty === '(Medium)' ? 'medium' : 'hard')}`}>{problem.difficulty}</span>
                  <span className={`problem-status ${isProblemSolved(problem.name) ? "problem-solved" : "problem-unsolved"}`} 
                    onClick={() => updateProblemStatus(problem.name)}>
                    {isProblemSolved(problem.name) ? "Solved" : "Unsolved"}
                  </span>
                </div>
              ))}
          </div>
        ))}
        </div>
    </div>
  );
}

export default Gamam150;