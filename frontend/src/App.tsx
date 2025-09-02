import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Protected from "./components/Protected";
import Layout from "./components/Layout";

// твоё
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import Dashboard from "@/pages/Dashboard/Dashboard";
import PropertiesList from "@/pages/PropertiesList/PropertiesList";
import PropertyCreate from "@/pages/PropertyCreate/PropertyCreate";
import PropertyDetail from "@/pages/PropertyDetail/PropertyDetail";
import PropertyEdit from "@/pages/PropertyEdit/PropertyEdit";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword/ResetPassword";
import EmailVerifyPage from "@/pages/EmailVerifyPage/EmailVerifyPage";

// новое
import ObjectsPage from "@/pages/Objects";          // /objects/:preset
import ShowingsPage from "@/pages/Showings/Showings"; // /showings

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* публичные */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<EmailVerifyPage />} />

        {/* временно оставим /dashboard публичным, если он тебе нужен */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* редирект с корня на «Показы» */}
        <Route path="/" element={<Navigate to="/showings" replace />} />

        {/* защищённые с Layout */}
        <Route
          path="/showings"
          element={
            <Protected>
              <Layout>
                <ShowingsPage />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/objects/:preset"
          element={
            <Protected>
              <Layout>
                <ObjectsPage />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/properties"
          element={
            <Protected>
              <Layout>
                <PropertiesList />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/properties/new"
          element={
            <Protected>
              <Layout>
                <PropertyCreate />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/properties/:id"
          element={
            <Protected>
              <Layout>
                <PropertyDetail />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/properties/:id/edit"
          element={
            <Protected>
              <Layout>
                <PropertyEdit />
              </Layout>
            </Protected>
          }
        />

        {/* запасной: если что-то не совпало — домой на показы */}
        <Route path="*" element={<Navigate to="/showings" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
