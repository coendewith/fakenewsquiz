import React, { useContext, useEffect } from 'react';
import QuizQuestion from './QuizQuestion';
import { QuizContext } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';

function Quiz() {
  const { state } = useContext(QuizContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.gameState === 'results') {
      navigate('/results');
    }
  }, [state.gameState, navigate]);

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <div className="flex items-center justify-center min-h-screen">
      {currentQuestion ? (
        <QuizQuestion
          question={currentQuestion}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={state.questions.length}
          currentScore={state.score}
          fakeLabel="Fake"
          realLabel="Real"
        />
      ) : (
        <div className="flex items-center justify-center">
          <p>Loading questions...</p>
        </div>
      )}
    </div>
  );
}

export default Quiz;
