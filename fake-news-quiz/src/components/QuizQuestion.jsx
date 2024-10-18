import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { QuizContext } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

function QuizQuestion({ question, questionNumber, currentScore }) {
  const { state, dispatch, ACTIONS } = useContext(QuizContext);
  const [timer, setTimer] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const intervalId = useRef(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(currentScore);
  const navigate = useNavigate();

  // Framer Motion Hooks
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const opacityFalse = useTransform(x, [-150, 0], [1, 0]);
  const opacityTrue = useTransform(x, [0, 150], [0, 1]);

  useEffect(() => {
    // Reset timer and states when question changes
    setTimer(0);
    setShowAnswer(false);
    setUserAnswer(null);
    setIsCorrect(null);
    setScore(0);

    // Reset animation controls
    controls.set({ x: 0, rotate: 0, opacity: 1 });

    // Start timer
    intervalId.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId.current);
  }, [question, controls]);

  const calculateScore = (isCorrect, timeElapsed) => {
    if (!isCorrect) return 0;
    const baseScore = 500;
    const timeBonus = Math.max(0, 30 - timeElapsed) * 10; // 10 points for each second under 30, up to 30 seconds
    return baseScore + timeBonus;
  };

  const isFakeRating = (rating) => {

    const fakeRatings = ['Unfounded', 'Fake', 'Unproven', 'False', 'Originated as Satire', 'Mixture', 'Misattributed', 'Miscaptioned', 'Legend', 'Mostly False', 'Outdated', 'Scam', 'Labeled Satire'];
    return fakeRatings.includes(rating.trim());
  };

  const isTrueRating = (rating) => {
    const trueRatings = ['True', 'Correct Attribution', 'Mostly True', 'Legit'];
    return trueRatings.includes(rating.trim());
  };

  const handleAnswerClick = useCallback(
    (answer) => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      setShowAnswer(true);
      setUserAnswer(answer === 'True');

      const questionRating = question.Rating.trim();
      const correct = (answer === 'True' && isTrueRating(questionRating)) || (answer === 'False' && isFakeRating(questionRating));
      setIsCorrect(correct);
      const newScore = calculateScore(correct, timer);
      setScore(newScore);
      setTotalScore(prevTotal => prevTotal + newScore);

      // Dispatch the answer with all necessary information
      dispatch({
        type: ACTIONS.ANSWER_QUESTION,
        payload: {
          correct,
          score: newScore,
          time: timer,
          question: question.Summary,
          context: question.Context,
          url: question.Image,
          title: question.Title || '',
          rating: question.Rating,
          articleUrl: question.URL,
          id: question.id,
        },
      });
    },
    [question, timer, dispatch, ACTIONS]
  );

  const handleContinue = useCallback(() => {
    if (state.lives > 0) {
      dispatch({ type: ACTIONS.NEXT_QUESTION });
      setShowAnswer(false);
    } else {
      dispatch({ type: ACTIONS.FINISH_QUIZ });
      navigate('/results');
    }
  }, [state.lives, dispatch, ACTIONS, navigate]);

  const handleDragEnd = useCallback(
    (event, info) => {
      const threshold = 150;
      if (info.offset.x > threshold) {
        handleAnswerClick('True');
        controls.start({ x: 500, rotate: 45, opacity: 0, transition: { duration: 0.5 } });
      } else if (info.offset.x < -threshold) {
        handleAnswerClick('False');
        controls.start({ x: -500, rotate: -45, opacity: 0, transition: { duration: 0.5 } });
      } else {
        controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
    },
    [handleAnswerClick, controls]
  );

  const answerAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  if (!question) {
    return null; // or a loading state
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {!showAnswer && (
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 max-w-md sm:max-w-xl md:max-w-2xl mx-auto"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, opacity }}
            animate={controls}
            whileTap={{ cursor: 'grabbing' }}
          >
            <header className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h2 className="text-xl font-bold mb-2 sm:mb-0">
                Question {questionNumber}
              </h2>
              <div className="text-gray-600">Time: {timer}s</div>
            </header>
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold">Current Score: {totalScore}</p>
              <div className="flex justify-center mt-2">
                {[...Array(3)].map((_, index) => (
                  index < state.lives ? 
                    <FaHeart key={index} className="text-red-500 text-2xl mx-1" /> :
                    <FaRegHeart key={index} className="text-red-500 text-2xl mx-1" />
                ))}
              </div>
            </div>
            <div className="mb-6">
              {question.Image && (
                <img
                  src={question.Image}
                  alt="Question"
                  className="w-full h-auto max-h-60 sm:max-h-80 object-contain mb-4 rounded-lg"
                />
              )}
              <p className="text-lg text-center">{question.Summary}</p>
              <p className="text-sm text-gray-600 text-center mt-2">
                Fact Date: {new Date(question.Date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <motion.div
                className="text-red-500 font-bold text-2xl mr-4"
                style={{ opacity: opacityFalse }}
              >
                FALSE
              </motion.div>
              <motion.div
                className="text-green-500 font-bold text-2xl ml-4"
                style={{ opacity: opacityTrue }}
              >
                TRUE
              </motion.div>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={() => handleAnswerClick('False')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Fake
              </button>
              <button
                onClick={() => handleAnswerClick('True')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Real
              </button>
            </div>
          </motion.div>
        )}
        {showAnswer && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={answerAnimation}
            className={`bg-white shadow-md rounded-lg p-6 max-w-md sm:max-w-xl md:max-w-2xl mx-auto mt-4 ${
              isCorrect === null ? '' : isCorrect ? 'border-green-500 border-4' : 'border-red-500 border-4'
            }`}
          >
            <h3 className="text-xl font-bold mb-4">Answer</h3>
            <p className="mb-4">
              The statement is{' '}
              {isFakeRating(question.Rating.trim()) ? 'fake' : isTrueRating(question.Rating.trim()) ? 'true' : 'ambiguous'}.
            </p>
            <p className="mb-4">
              {question.Context}
            </p>
            {isCorrect !== null && (
              <>
                <p
                  className={`mb-4 font-bold ${
                    isCorrect ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect!'}
                </p>
                {isCorrect && (
                  <p className="mb-4 font-bold text-blue-500">
                    You scored {score} points!
                  </p>
                )}
              </>
            )}
            <p className="mb-4 font-bold">
              Total Score: {totalScore}
            </p>
            <a
              href={question.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mb-4 block"
            >
              Read the full article
            </a>
            <button
              onClick={handleContinue}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
            >
              {state.lives > 0 ? 'Continue' : 'View Results'}
            </button>
          </motion.div>
        )}
        <p className="text-center text-gray-600 mt-4">
          Or swipe left for False, right for True
        </p>
        <div className="mt-8 text-center">
          <button
            onClick={() => { dispatch({ type: ACTIONS.RESTART_QUIZ }); navigate('/'); }}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizQuestion;
