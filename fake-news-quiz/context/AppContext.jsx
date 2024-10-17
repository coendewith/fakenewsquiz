import React, { createContext, useState } from 'react';

// Create the Context
export const AppContext = createContext();

// Create the Provider Component
export const AppProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [leaderboard, setLeaderboard] = useState([
    { username: 'Player1', score: 100 },
    { username: 'Player2', score: 90 },
    { username: 'Player3', score: 80 },
    { username: 'Player4', score: 70 },
    { username: 'Player5', score: 60 },
  ]);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  return (
    <AppContext.Provider
      value={{
        username,
        setUsername,
        difficulty,
        setDifficulty,
        selectedTag,
        setSelectedTag,
        selectedDateRange,
        setSelectedDateRange,
        leaderboard,
        setLeaderboard,
        score,
        setScore,
        totalScore,
        setTotalScore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};