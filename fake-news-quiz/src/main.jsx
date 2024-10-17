import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { QuizProvider } from './context/QuizContext'
import './index.css'  // Add this line

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <QuizProvider>
      <App />
    </QuizProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
