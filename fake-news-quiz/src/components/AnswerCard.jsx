// src/components/AnswerCard.js
import React from 'react';

function AnswerCard({ card, index, isFinal }) {
  const {
    question,
    correctAnswer,
    context,
    isCorrect,
    score,
    url,    // Image URL
    title,  // Title value
    rating, // Rating value
    articleUrl, // Add this new prop for the article URL
  } = card;

  return (
    <div className="flex items-center justify-between bg-gray-50 shadow-md rounded-lg p-4 mb-4">
      {/* Left Side: Question and Details */}
      <div className="flex-1 pr-4">
        <h3 className="text-xl font-semibold mb-2">
          Question {index + 1} - {title}
        </h3>
        <p className="text-gray-700 mb-1">{question}</p>
        <p className={`mb-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          The statement is {rating}
      
        </p>
        <p className="text-gray-700">
          Your answer was {isCorrect ? 'correct' : 'incorrect'}
        </p>
        {/* Optionally, you can display the context or other details */}
        {isFinal && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">{context}</p>
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mb-4 block"
            >
              Read the full article
            </a>
          </div>
        )}
      </div>

      {/* Right Side: Image */}
      {/* {url && ( */}
        <div className="flex-shrink-0">
          <img
            src={url}
            alt={`Question ${index + 1}`}
            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
          />
        </div>
      {/* )} */}
    </div>
  );
}

export default AnswerCard;
