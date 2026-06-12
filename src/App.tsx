import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
import Blogs from './pages/Blogs';
import Contacts from './pages/Contacts';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Packages from './pages/Packages';
import ContactDetails from './pages/ContactDetails';
// import Bookings from './pages/Bookings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard/contacts" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/contacts" replace />} />
          {/* <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/dashboard/blogs"
            element={
              <ProtectedRoute>
                <Layout>
                  <Blogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/contacts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Contacts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <Jobs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/applications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/packages"
            element={
              <ProtectedRoute>
                <Layout>
                  <Packages />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/contact-details"
            element={
              <ProtectedRoute>
                <Layout>
                  <ContactDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/dashboard/bookings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Bookings />
                </Layout>
              </ProtectedRoute>
            }
          /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
