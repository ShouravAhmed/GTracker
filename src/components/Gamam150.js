import "../assets/styles/Gamam150.css";

import React, { useState, useEffect } from "react";

import gamamJson from "../assets/json/gamam150.json";

function Gamam150() {

    const [codingProblems, setCodingProblems] = useState({});
    const [problemStatusToggle, setProblemStatusToggle] = useState(false);

    const [isCodingChecked, setIsCodingChecked] = useState(true);
    const [isSystemDesignChecked, setIsSystemDesignChecked] = useState(true);
    const [isObjectOrientedDesignChecked, setIsObjectOrientedDesignChecked] = useState(true);
    const [isSchemaDesignChecked, setIsSchemaDesignChecked] = useState(true);
    const [isApiDesignChecked, setIsApiDesignChecked] = useState(true);
    const [isBehavioralChecked, setIsBehavioralChecked] = useState(true);
    

     // Use useCallback to memoize fetchCodingProblems function
    const fetchCodingProblems = useCallback(() => {
        const data = {};
        
        if (isCodingChecked) {
            for (const item of gamamJson.Coding) {
                if (!("day" in item)) continue;
                item["type"] = "Coding";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }
        
        if (isSystemDesignChecked) {
            for (const item of gamamJson.SystemDesign) {
                if (!("day" in item)) continue;
                item["type"] = "System Design";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }

        if (isObjectOrientedDesignChecked) {
            for (const item of gamamJson.ObjectOrientedDesign) {
                if (!("day" in item)) continue;
                item["type"] = "Object Oriented Design";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }

        if (isSchemaDesignChecked) {
            for (const item of gamamJson.SchemaDesign) {
                if (!("day" in item)) continue;
                item["type"] = "Schema Design";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }

        if (isApiDesignChecked) {
            for (const item of gamamJson.APIDesign) {
                if (!("day" in item)) continue;
                item["type"] = "API Design";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }

        if (isBehavioralChecked) {
            for (const item of gamamJson.Behavioral) {
                if (!("day" in item)) continue;
                item["type"] = "Behavioral";
                if (!(item.day in data)) data[item.day] = [];
                data[item.day].push(item);
            }
        }

        setCodingProblems(data);
    }, [
        isCodingChecked,
        isSystemDesignChecked,
        isObjectOrientedDesignChecked,
        isSchemaDesignChecked,
        isApiDesignChecked,
        isBehavioralChecked,
    ]);

    // Run fetchCodingProblems whenever the dependencies change
    useEffect(() => {
        fetchCodingProblems();
    }, [fetchCodingProblems]);

    const isDayCompleted = (day) => {
        const problems = codingProblems[day];
        let cnt = 0;
        for (const problem of problems) {
            const status = localStorage.getItem(problem.name);
            if (status === "true") cnt += 1;
        }
        return cnt === problems.length;
    };

    const isProblemSolved = (problemName) => {
      const status = localStorage.getItem(problemName);
      return (status === 'true');
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

        <div className="checkbox-row">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="coding"
              checked={isCodingChecked}
              onChange={() => setIsCodingChecked(!isCodingChecked)}
            />
            <label htmlFor="coding">Coding</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="system-design"
              checked={isSystemDesignChecked}
              onChange={() => setIsSystemDesignChecked(!isSystemDesignChecked)}
            />
            <label htmlFor="system-design">System Design</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="object-oriented-design"
              checked={isObjectOrientedDesignChecked}
              onChange={() => setIsObjectOrientedDesignChecked(!isObjectOrientedDesignChecked)}
            />
            <label htmlFor="object-oriented-design">Object Oriented Design</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="schema-design"
              checked={isSchemaDesignChecked}
              onChange={() => setIsSchemaDesignChecked(!isSchemaDesignChecked)}
            />
            <label htmlFor="schema-design">Schema Design</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="api-design"
              checked={isApiDesignChecked}
              onChange={() => setIsApiDesignChecked(!isApiDesignChecked)}
            />
            <label htmlFor="api-design">API Design</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="behavioral"
              checked={isBehavioralChecked}
              onChange={() => setIsBehavioralChecked(!isBehavioralChecked)}
            />
            <label htmlFor="behavioral">Behavioral</label>
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
                  <span className="problem-no">{problemNo + 1}</span>
                  <a className="problem-url" href={problem.url} target="_blank" rel="noopener noreferrer">{problem.name}</a>
                  
                  <div className="problem-difficulty">
                    <span>{problem.type}</span>
                    {problem.difficulty && <span className={`${problem.difficulty === '(Easy)' ? "problem-difficulty-easy" : (problem.difficulty === '(Medium)' ? 'problem-difficulty-medium' : 'problem-difficulty-hard')}`}>{problem.difficulty}</span>}
                  </div>

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