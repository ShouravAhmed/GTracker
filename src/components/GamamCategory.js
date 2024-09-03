import "../assets/styles/Gamam150.css";

import React, { useState, useEffect, useCallback } from "react";

import gamamJson from "../assets/json/gamam150.json";

function GamamCategory({ categoryName }) {

    const [problemsList, setProblemsList] = useState([]);
    const [problemStatusToggle, setProblemStatusToggle] = useState(false);    

    const fetchCodingProblems = useCallback(() => {
    setProblemsList(gamamJson[categoryName]);
}, [categoryName]); 
    
    useEffect(() => {
        fetchCodingProblems();
    }, [fetchCodingProblems]);


    const isProblemSolved = (problemName) => {
      const status = localStorage.getItem(problemName);
      return (status === 'true');
    }

    const updateProblemStatus = (problemName) => {
      const status = localStorage.getItem(problemName);
      const newStatus = status === "true" ? "false" : "true";
      console.log('New Status:', newStatus);
      localStorage.setItem(problemName, newStatus);
      setProblemStatusToggle(!problemStatusToggle);
    };
    const totalSolved = problemsList.filter(problem => localStorage.getItem(problem.name) === 'true').length;

  return (
    <div className="gamam-tracker">
        <h1 className="title">{categoryName}</h1>
      
        <div className="summary-row">
          <div className="summary-item right">
            <span>Total Solved</span>
            <strong>{totalSolved}</strong>
          </div>
        </div>

        <div className="problem-list">
            {problemsList.map((problem, problemNo) => (
                <div className="problem-row">
                    <span className="problem-no">{problemNo + 1}</span>
                    <a className="problem-url" href={problem.url} target="_blank" rel="noopener noreferrer">{problem.name}</a>
                    
                    <div className="problem-difficulty">
                    {problem.difficulty && <span className={`${problem.difficulty === '(Easy)' ? "problem-difficulty-easy" : (problem.difficulty === '(Medium)' ? 'problem-difficulty-medium' : 'problem-difficulty-hard')}`}>{problem.difficulty}</span>}
                    </div>

                    <span className={`problem-status ${isProblemSolved(problem.name) ? "problem-solved" : "problem-unsolved"}`} 
                    onClick={() => updateProblemStatus(problem.name)}>
                    {isProblemSolved(problem.name) ? "Solved" : "Unsolved"}
                    </span>
                </div>
            ))}
        </div>
    </div>
  );
}

export default GamamCategory;