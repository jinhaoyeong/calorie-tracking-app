import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { Diary } from './screens/Diary';
import { DishDetail } from './screens/DishDetail';
import { Dishes } from './screens/Dishes';
import { EditProfile } from './screens/EditProfile';
import { Onboarding } from './screens/Onboarding';
import { Profile } from './screens/Profile';
import { Progress } from './screens/Progress';
import { Scan } from './screens/Scan';
import { AppStateProvider, useApp } from './state/AppState';
import { ToastProvider } from './state/Toast';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function RequireProfile() {
  const { profile } = useApp();
  return profile ? <Outlet /> : <Navigate to="/welcome" replace />;
}

function WelcomeRoute() {
  const { profile } = useApp();
  return profile ? <Navigate to="/" replace /> : <Onboarding />;
}

function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <ToastProvider>
          <ScrollToTop />
          <div className="app">
            <Routes>
              <Route path="/welcome" element={<WelcomeRoute />} />
              <Route element={<RequireProfile />}>
                <Route element={<TabLayout />}>
                  <Route index element={<Diary />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="dishes" element={<Dishes />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="dishes/:id" element={<DishDetail />} />
                <Route path="scan" element={<Scan />} />
                <Route path="profile/edit" element={<EditProfile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  );
}
