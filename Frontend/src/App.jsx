import React from "react";
import { RouterProvider } from "react-router-dom";
import routes from "./routes/PublicRoute"; // routes là router object
import { AuthProvider } from "./contexts/AuthContext";
import ToastProvider from "./components/ui/ToastProvider";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={routes} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
