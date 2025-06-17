import React, { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout, Spin } from "antd";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./routes/ProtectedRouted";
import { fetchProfile } from "./store/authReducer";

// Lazy load pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const LoginPage = React.lazy(() => import("./pages/auth/Login"));
const UserPage = React.lazy(() => import("./pages/UserPage"));
const User = React.lazy(() => import("./pages/dashboard/User"));
const DashboardPage = React.lazy(() =>
  import("./pages/dashboard/DashboardPage")
);
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const Reading = React.lazy(() => import("./pages/ielts/Reading"));
const Writing = React.lazy(() => import("./pages/ielts/Writing"));
const Listening = React.lazy(() => import("./pages/ielts/Listening"));
const NewWriting = React.lazy(() => import("./pages/create/NewWriting"));
const NewReading = React.lazy(() => import("./pages/create/NewReading"));
const NewListening = React.lazy(() => import("./pages/create/NewListening"));
const ReadingAnswers = React.lazy(() =>
  import("./pages/create/ReadingAnswers")
);
const ListeningExam = React.lazy(() => import("./pages/exam/ListeningExam"));
const WritingExam = React.lazy(() => import("./pages/exam/WritingExam"));
const ReadingExam = React.lazy(() => import("./pages/exam/ReadingExam"));
const UserDetails = React.lazy(() => import("./pages/dashboard/UserDetailts"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const WritingDetails = React.lazy(() => import("./pages/create/WritingDetails"));
const WritingHistory = React.lazy(() => import('./pages/details/WritingHistory'));
const ReadingHistory = React.lazy(() => import('./pages/details/ReadingHistory'));
const ListeningHistory = React.lazy(() => import('./pages/details/Listeninghistory'));

const { Content: AntContent } = Layout;

function App() {
  const { accessToken, isLoggedIn, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      dispatch(fetchProfile());
    } else {
      navigate("/login");
    }
  }, [isLoggedIn, accessToken]);

  return (
    <Layout style={{ width: "100%", height: "100vh" }}>
      <ToastContainer />
      <AntContent>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100%",
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {["ROLE_ADMIN", "ROLE_TEACHER", "ROLE_SUPER_ADMIN"].some(
                    (role) => user?.roles.includes(role)
                  ) ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <HomePage />
                  )}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  requiredRoles={[
                    "ROLE_ADMIN",
                    "ROLE_TEACHER",
                    "ROLE_SUPER_ADMIN",
                  ]}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route path="" element={<DashboardPage />} />
              <Route path="users" element={<User />} />
              <Route path="user/:id" element={<UserDetails />} />
              <Route path="ielts/listening" element={<Listening />} />
              <Route path="ielts/listening/:id" element={<NewListening />} />
              <Route path="ielts/reading" element={<Reading />} />
              <Route path="ielts/reading/create" element={<NewReading />} />
              <Route
                path="ielts/reading/:id/questions"
                element={<ReadingAnswers />}
              />
              <Route path="ielts/writing" element={<Writing />} />
              <Route path="ielts/writing/:id" element={<WritingDetails />} />
              <Route path="ielts/writing/create" element={<NewWriting />} />
              <Route path="history/:id/writing" element={<WritingHistory />} />
              <Route path="history/:id/reading" element={<ReadingHistory />} />
              <Route path="history/:id/listening" element={<ListeningHistory />} />
            </Route>
            <Route
              path="exam"
              element={
                <ProtectedRoute>
                  <UserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listening/:id"
              element={
                <ProtectedRoute>
                  <ListeningExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reading/:id"
              element={
                <ProtectedRoute>
                  <ReadingExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/writing/:id"
              element={
                <ProtectedRoute>
                  <WritingExam />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AntContent>
    </Layout>
  );
}

export default App;
