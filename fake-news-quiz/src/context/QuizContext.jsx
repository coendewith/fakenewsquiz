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
  factChecks: [],
  lives: 3, // Lives remaining
  usedQuestionIds: [], // To track used questions
};

// Actions
const ACTIONS = {
  START_QUIZ: 'START_QUIZ',
  ANSWER_QUESTION: 'ANSWER_QUESTION',
  NEXT_QUESTION: 'NEXT_QUESTION',
  FETCH_MORE_QUESTIONS: 'FETCH_MORE_QUESTIONS',
  FINISH_QUIZ: 'FINISH_QUIZ',
  RESTART_QUIZ: 'RESTART_QUIZ',
  SET_ERROR: 'SET_ERROR',
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
        usedQuestionIds: [], // Reset used questions
      };
    case ACTIONS.ANSWER_QUESTION:
      const { correct, score, time, question, context, url, title, rating, articleUrl, id } = action.payload;
      return {
        ...state,
        score: state.score + score,
        totalTime: state.totalTime + time,
        lives: correct ? state.lives : state.lives - 1, // Update lives
        usedQuestionIds: [...state.usedQuestionIds, id], // Add to used questions
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
            articleUrl,
          },
        ],
      };
    case ACTIONS.NEXT_QUESTION:
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };
    case ACTIONS.FETCH_MORE_QUESTIONS:
      return {
        ...state,
        questions: [...state.questions, ...action.payload.newQuestions],
        usedQuestionIds: [...state.usedQuestionIds, ...action.payload.newQuestionIds],
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
        usedQuestionIds: action.payload.questions.map(q => q.id),
      };
    default:
      return state;
  }
}

// Provider Component
export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Fetch initial questions when quiz starts
  useEffect(() => {
    if (state.gameState === 'quiz' && state.questions.length === 0) {
      fetchFactChecks(state.user.selectedTag, state.user.selectedDateRange, 20, state.usedQuestionIds)
        .then(data => {
          if (data.length === 0) {
            dispatch({ 
              type: ACTIONS.SET_ERROR, 
              payload: { error: `No more unique questions available. Please try different filters or restart the quiz.` } 
            });
            return;
          }
          dispatch({ type: ACTIONS.SET_QUESTIONS, payload: { questions: data } });
        })
        .catch(error => {
          dispatch({ type: ACTIONS.SET_ERROR, payload: { error: error.message } });
        });
    }
  }, [state.gameState, state.user, state.usedQuestionIds]);

  // Fetch more questions when nearing the end
  useEffect(() => {
    if (state.gameState !== 'quiz') return;

    const buffer = 2; // When 2 questions are left, fetch more
    if (state.currentQuestionIndex + buffer >= state.questions.length) {
      fetchFactChecks(state.user.selectedTag, state.user.selectedDateRange, 20, state.usedQuestionIds)
        .then(data => {
          if (data.length === 0) {
            // No more unique questions available
            dispatch({ 
              type: ACTIONS.SET_ERROR, 
              payload: { error: `No more unique questions available. Please continue until you lose all lives.` } 
            });
            return;
          }
          const newQuestions = data;
          const newQuestionIds = data.map(q => q.id);
          dispatch({ type: ACTIONS.FETCH_MORE_QUESTIONS, payload: { newQuestions, newQuestionIds } });
        })
        .catch(error => {
          dispatch({ type: ACTIONS.SET_ERROR, payload: { error: error.message } });
        });
    }
  }, [state.currentQuestionIndex, state.questions.length, state.gameState, state.user, state.usedQuestionIds]);

  return (
    <QuizContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </QuizContext.Provider>
  );
}

export const QuizContext = createContext();
