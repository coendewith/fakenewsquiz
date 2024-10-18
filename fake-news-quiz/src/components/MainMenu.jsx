import React, { useState, useEffect, useContext } from 'react';
import TagSelector from './TagSelector';
import Leaderboard from './Leaderboard';
import { QuizContext } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function MainMenu() {
  const { dispatch, ACTIONS, state } = useContext(QuizContext);
  const [email, setEmail] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [leaderboard, setLeaderboard] = useState([
    { username: 'Player1', score: 100 },
    { username: 'Player2', score: 90 },
    { username: 'Player3', score: 80 },
    { username: 'Player4', score: 70 },
    { username: 'Player5', score: 60 },
  ]);
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const saveEmailToSupabase = async (email) => {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .upsert({ 
          email
        }, { onConflict: 'email' })
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Email saved or updated successfully:', data);
      return data[0];
    } catch (error) {
      console.error('Error saving email:', error.message);
      console.error('Error details:', error);
      throw error;
    }
  };

  const checkEmailInSupabase = async (email) => {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
      throw error;
    }

    return data;
  };

  const insertEmailToSupabase = async (email) => {
    const { data, error } = await supabase
      .from('email_subscribers')
      .insert({ 
        email
      })
      .select();

    if (error) {
      console.error('Error inserting email:', error);
      throw error;
    }

    return data[0];
  };

  const handleStart = async () => {
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    localStorage.setItem('quizEmail', email);

    try {
      console.log('Starting quiz with email:', email);
      
      let userData = await checkEmailInSupabase(email);
      
      if (!userData) {
        userData = await insertEmailToSupabase(email);
        console.log('New email saved:', userData);
      } else {
        console.log('Existing email found:', userData);
      }

      localStorage.setItem('userEmail', email);

      const user = { email, selectedTag, selectedDateRange };
      dispatch({ type: ACTIONS.START_QUIZ, payload: { user } });
      navigate('/quiz');
    } catch (error) {
      console.error('Error starting quiz:', error.message);
      console.error('Full error object:', error);
      alert('An error occurred while starting the quiz. Please try again.');
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        handleStart();
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [email, selectedTag, selectedDateRange]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('quizEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const dateRanges = [
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  const handleDateRangeChange = (value) => {
    setSelectedDateRange(value);
    console.log('Selected date range:', value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen app-background">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-6">
          <img src="/fake_news_quiz_logo_medium.png" alt="Fake News Quiz Logo" className="w-[8rem] h-[8rem] mr-8" />
          <h1 className="text-3xl font-bold italic">Fake News Quiz</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2 text-center">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label htmlFor="tag" className="block text-gray-700 text-sm font-bold mb-2 text-center">
              Select Quiz Subject
            </label>
            <TagSelector 
              selectedTag={selectedTag} 
              setSelectedTag={setSelectedTag} 
              selectedDateRange={selectedDateRange}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
              Select Date Range
            </label>
            <div className="flex justify-between w-full">
              {dateRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeChange(range.value)}
                  className={`py-2 px-2 rounded text-xs ${
                    selectedDateRange === range.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ width: '23%' }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Start Quiz
          </button>
          <p className="text-sm text-gray-600 text-center mt-2">
            Press ENTER to start the quiz
          </p>
        </div>
      </div>
      
      <Leaderboard leaderboard={leaderboard} />

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Created by <a href="https://github.com/coendewith" className="text-blue-500 hover:underline">CoendeWith</a>
        </p>
        <p>
          Powered by <a href="https://www.snopes.com/" className="text-blue-500 hover:underline">Snopes</a>
        </p>
      </div>
    </div>
  );
}

export default MainMenu;
