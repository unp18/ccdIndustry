import React, { useState } from "react";
import FileUpload from "./Components/FileUpload";
import CompanyForm from "./Components/CompanyForm";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Components/Navbar";
import { useAuth } from "./context/AuthProvider.jsx";

const App = () => {
  const [mode, setMode] = useState("manual");
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-gray-800">DPR Portal</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your company and HR data</p>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex w-auto mb-8 overflow-hidden bg-white rounded-lg shadow-md p-1">
                <button
                  onClick={() => setMode("file")}
                  className={`w-auto px-4 py-3 text-gray-600 text-sm rounded-lg font-medium text-center ${
                    mode === "file"
                      ? "bg-blue-600 text-white"
                      : "hover:text-blue-400"
                  } transition-colors`}
                >
                  Upload CSV File
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className={`w-auto px-4 py-3 text-sm text-gray-600 rounded-lg font-medium text-center ${
                    mode === "manual"
                      ? "bg-blue-600 text-white"
                      : "hover:text-blue-400"
                  } transition-colors`}
                >
                  Enter Data Manually
                </button>
              </div>
          </div>

          <div className="mt-4">
            {mode === "file" ? <FileUpload /> : <CompanyForm />}
          </div>
        </div>
      </div>
    </div>
  );
};


export default App;
