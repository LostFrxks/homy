import { BrowserRouter, Routes, Route } from "react-router-dom";
import Protected from "./components/Protected";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import PropertiesList from "./pages/PropertiesList";
import PropertyCreate from "./pages/PropertyCreate";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyEdit from "./pages/PropertyEdit";

import Layout from "./components/Layout";

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
      </Routes>
    </BrowserRouter>
  );
}
