import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import OrganizationSetup from "./pages/OrganizationSetup";
import EmployeeDirectory from "./pages/EmployeeDirectory";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/signup" replace />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/organization-setup"
          element={<OrganizationSetup />}
        />

        <Route
          path="/employee-directory"
          element={<EmployeeDirectory />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;