import React, { createContext, useReducer, useEffect } from 'react';
import { fetchFactChecks } from '../services/dataService';

// Initial State
const initialState = {
  gameState: 'menu', // 'menu', 'quiz', 'results'
  user: { username: '', difficulty: 'easy', selectedDateRange: 'all' },
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  totalTime: 0,
  error: null,
  answerCards: [],
  factChecks: [], // Store fetched data here
};

// Actions
const ACTIONS = {
  START_QUIZ: 'START_QUIZ',
  ANSWER_QUESTION: 'ANSWER_QUESTION',
  NEXT_QUESTION: 'NEXT_QUESTION',
  FINISH_QUIZ: 'FINISH_QUIZ',
  RESTART_QUIZ: 'RESTART_QUIZ',
  SET_ERROR: 'SET_ERROR',
  SET_FACT_CHECKS: 'SET_FACT_CHECKS', // New action to set data
  SET_QUESTIONS: 'SET_QUESTIONS',
};

// Reducer
function quizReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FACT_CHECKS:
      return {
        ...state,
        factChecks: action.payload.factChecks,
      };
    case ACTIONS.START_QUIZ:
      return {
        ...state,
        gameState: 'quiz',
        user: action.payload.user,
        questions: [], // We'll fetch questions after setting the user
        currentQuestionIndex: 0,
        score: 0,
        totalTime: 0,
        error: null,
        answerCards: [],
      };
    case ACTIONS.ANSWER_QUESTION:
      const { correct, score, time, question, context, url, title, rating,articleUrl
      } = action.payload;
      return {
        ...state,
        score: state.score + score,
        totalTime: state.totalTime + time,
        answerCards: [
          ...state.answerCards,
          {
            question,
            correctAnswer: correct,
            context,
            isCorrect: correct,
            score,
            url,
            title,
            rating,
            articleUrl
            
          },
        ],
      };
    case ACTIONS.NEXT_QUESTION:
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          gameState: 'results',
        };
      }
      return {
        ...state,
        currentQuestionIndex: nextIndex,
      };
    case ACTIONS.FINISH_QUIZ:
      return {
        ...state,
        gameState: 'results',
      };
    case ACTIONS.RESTART_QUIZ:
      return {
        ...initialState,
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };
    case ACTIONS.SET_QUESTIONS:
      return {
        ...state,
        questions: action.payload.questions,
      };
    default:
      return state;
  }
}

// Helper Functions
function selectRandomQuestions(data, num = 5, tag = '', dateRange = 'all') {
  let filteredData = data;

  // Filter by tag if selected
  if (tag) {
    filteredData = filteredData.filter(factCheck => factCheck.Tags.includes(tag));
  }

  // Filter by date range if not 'all'
  if (dateRange !== 'all') {
    const startDate = getStartDate(dateRange);
    if (startDate) {
      filteredData = filteredData.filter(factCheck => {
        const factDate = new Date(factCheck.Date);
        return factDate >= startDate;
      });
    }
  }

  // Shuffle the filtered data
  const shuffled = filteredData.sort(() => 0.5 - Math.random());

  // Select the top 'num' questions
  return shuffled.slice(0, num);
}

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3months':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
    default:
      return null;
  }
}

// Create Context
export const QuizContext = createContext();

// Provider Component
export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  useEffect(() => {
    if (state.gameState === 'quiz' && state.questions.length === 0) {
      fetchFactChecks(state.user.selectedTag, state.user.selectedDateRange, 5)
        .then(data => {
          const shuffled = data.sort(() => 0.5 - Math.random());
          const selectedQuestions = shuffled.slice(0, 5);
          
          // Check if we have enough unique questions
          if (selectedQuestions.length < 5) {
            dispatch({ 
              type: ACTIONS.SET_ERROR, 
              payload: { 
                error: "Not enough unique questions available. Please try different filters or try again later." 
              } 
            });
          } else {
            dispatch({ type: ACTIONS.SET_QUESTIONS, payload: { questions: selectedQuestions } });
          }
        })
        .catch(error => {
          dispatch({ type: ACTIONS.SET_ERROR, payload: { error: error.message } });
        });
    }
  }, [state.gameState, state.user]);

  return (
    <QuizContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </QuizContext.Provider>
  );
}
