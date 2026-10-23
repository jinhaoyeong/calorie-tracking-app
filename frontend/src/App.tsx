import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { CreateFood } from './screens/CreateFood';
import { EditProfile } from './screens/EditProfile';
import { FoodDetail } from './screens/FoodDetail';
import { Foods } from './screens/Foods';
import { Home } from './screens/Home';
import { Me } from './screens/Me';
import { Onboarding } from './screens/Onboarding';
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
                  <Route index element={<Home />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="foods" element={<Foods />} />
                  <Route path="me" element={<Me />} />
                </Route>
                <Route path="foods/new" element={<CreateFood />} />
                <Route path="foods/:id" element={<FoodDetail />} />
                <Route path="scan" element={<Scan />} />
                <Route path="me/edit" element={<EditProfile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  );
}
