/* eslint-disable */
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";

import { AuthProvider } from "./hooks/AuthContext";
import { BusinessProvider, useBusiness } from "./hooks/BusinessContext";
import { LeadsProvider } from "./hooks/LeadsContext";
import { OnboardingProvider } from "./hooks/OnboardingContext";
import { ShareProvider } from "./hooks/ShareContext";

import PrivateRoute from "./components/auth/PrivateRoute";
import OnboardingBanner from "./components/onboarding/OnboardingBanner";

import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import ImportPage from "./pages/ImportPage";
import BusinessesPage from "./pages/BusinessesPage";
import SettingsPage from "./pages/SettingsPage";
import SharedPage from "./pages/SharedPage";

// Wrapper so LeadsProvider can read activeBusiness from BusinessContext
function LeadsProviderWrapper({ children }) {
  const { activeBusiness } = useBusiness();
  return (
    <LeadsProvider activeBusiness={activeBusiness}>
      {children}
    </LeadsProvider>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/signup"        element={<Signup />} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/leads"         element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
        <Route path="/import"        element={<PrivateRoute><ImportPage /></PrivateRoute>} />
        <Route path="/businesses"    element={<PrivateRoute><BusinessesPage /></PrivateRoute>} />
        <Route path="/settings"      element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <OnboardingBanner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <LeadsProviderWrapper>
            <OnboardingProvider>
              <ShareProvider>
                <AppRoutes />
              </ShareProvider>
            </OnboardingProvider>
          </LeadsProviderWrapper>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}