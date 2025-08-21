import { BrowserRouter, Routes, Route } from "react-router-dom";
import Protected from "./components/Protected";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import PropertiesList from "./pages/PropertiesList";
import PropertyCreate from "./pages/PropertyCreate";

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
      </Routes>
    </BrowserRouter>
  );
}
