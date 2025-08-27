import { BrowserRouter, Routes, Route } from "react-router-dom";
import Protected from "./components/Protected";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import PropertiesList from "./pages/PropertiesList";
import PropertyCreate from "./pages/PropertyCreate";

import PropertyDetail from "./pages/PropertyDetail";
import PropertyEdit from "./pages/PropertyEdit";

import Register from "./pages/Register";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* публичный роут */}
        <Route path="/login" element={<Login />} />

        {/* защищённые роуты */}
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/properties"
          element={
            <Protected>
              <PropertiesList />
            </Protected>
          }
        />

        <Route
          path="/properties/new"
          element={
            <Protected>
              <PropertyCreate />
            </Protected>
          }
        />

        <Route
          path="/properties/:id"
          element={
            <Protected>
              <PropertyDetail />
            </Protected>
          }
        />

        <Route
          path="/properties/:id/edit"
          element={
            <Protected>
              <PropertyEdit />
            </Protected>
          }
        />
      </Routes>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />   {/* ⬅️ добавили */}

        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
      </Routes>

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
    </BrowserRouter>
  );
}
