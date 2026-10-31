import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { LandingPage, AboutPage, AuthPreviewPage, NotFoundPage } from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<AuthPreviewPage mode="login" />} />
        <Route path="register" element={<AuthPreviewPage mode="register" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

