import { BrowserRouter, Routes, Route } from "react-router-dom";
import Protected from "./components/Protected";

import Layout from "./components/Layout";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* публичные роуты */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* защищённые роуты с Layout */} 
        <Route
          path="/"
          element={
            <Protected>
              <Layout>
                <Dashboard />
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

      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<EmailVerifyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
