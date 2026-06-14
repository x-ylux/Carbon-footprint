import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import SkipToContent from './components/SkipToContent';
import LoadingFallback from './components/LoadingFallback';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const About = lazy(() => import('./pages/About'));
const CollectiveAction = lazy(() => import('./pages/CollectiveAction'));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
          <SkipToContent />
          <Navbar />
          <main id="main-content" className="flex-grow" tabIndex={-1}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/collective" element={<CollectiveAction />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calculator"
                  element={
                    <ProtectedRoute>
                      <Calculator />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
