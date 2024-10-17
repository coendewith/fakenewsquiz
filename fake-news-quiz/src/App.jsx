import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ReactGA from "react-ga4";
import MainMenu from './components/MainMenu'
import Quiz from './components/Quiz'
import Results from './components/Results'
import { QuizProvider } from './context/QuizContext'
// import Login from './components/Auth/Login'
// import { AuthProvider } from './context/AuthContext'

// Initialize GA with your Measurement ID
ReactGA.initialize("G-WXPZS82SJM");

function App() {
  useEffect(() => {
    // Send pageview with a custom path
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  return (
    // <AuthProvider>
      <QuizProvider>
        <Router>
          <div className="app-background min-h-screen">
            
            <Routes>
              <Route path="/" element={<MainMenu />} />
              {/* <Route path="/login" element={<Login />} /> */}
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/results" element={<Results />} />
              {/* Add this new route for email verification */}
              {/* <Route path="/auth/callback" element={<Navigate to="/login" />} /> */}
            </Routes>
          </div>
        </Router>
      </QuizProvider>
    //  </AuthProvider> 
  )
}

export default App
