/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { Toast } from './components/Toast';
import GoogleTranslate from './components/GoogleTranslate';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans flex flex-col">
          <Navigation />
          <main className="pt-16 flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <GoogleTranslate />
          <Toast />
        </div>
      </Router>
    </AuthProvider>
  );
}
