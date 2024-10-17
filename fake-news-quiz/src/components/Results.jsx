import React, { useState, useContext, useEffect } from 'react';
import { QuizContext } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';
import AnswerCard from './AnswerCard';
import { submitScore } from '../services/leaderboardService';

function Results() {
  const { state, dispatch, ACTIONS } = useContext(QuizContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    // Load the username from localStorage when the component mounts
    const savedUsername = localStorage.getItem('quizUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleRestart = () => {
    dispatch({ type: ACTIONS.RESTART_QUIZ });
    navigate('/');
  };

  const handleSubmitScore = async () => {
    if (!username.trim()) {
      setSubmitStatus('Please enter a username');
      return;
    }

    try {
      const subject = state.user.selectedTag || 'All Subjects';
      console.log('Submitting score:', { username, score: state.score, subject });
      await submitScore(username, state.score, subject);
      setSubmitStatus('Score submitted successfully!');
      
      // Save the username to localStorage
      localStorage.setItem('quizUsername', username);
    } catch (error) {
      console.error('Error submitting score:', error);
      console.error('Error details:', error.details);
      setSubmitStatus(`Failed to submit score: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Quiz Results</h1>
        <p className="text-gray-700 mb-4">Email: {state.user.email}</p>
        <p className="text-gray-700 mb-4">Score: {state.score}</p>
        <p className="text-gray-700 mb-6">Total Time: {state.totalTime} seconds</p>
        
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
            Enter username to submit score:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter username"
          />
        </div>
        
        <button
          onClick={handleSubmitScore}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Submit Score
        </button>
        
        {submitStatus && (
          <p className={`text-center ${submitStatus.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
            {submitStatus}
          </p>
        )}
        
        <button
          onClick={handleRestart}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Restart Quiz
        </button>
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Answer Review</h2>
        {state.answerCards.map((card, index) => (
          <AnswerCard
            key={index}
            card={card}
            index={index}
            isFinal={true}
          />
        ))}
      </div>
    </div>
  );
}

export default Results;
