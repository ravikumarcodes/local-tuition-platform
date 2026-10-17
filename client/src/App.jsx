import { useState } from "react";
import "./App.css";
import Batches from "./pages/Batches";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Sidebar from "./components/Sidebar";
import Fees from "./pages/Fees";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="app">

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      {/* Main Content */}

      <main className="main-content">

        {currentPage === "dashboard" && <Dashboard />}

        {currentPage === "students" && <Students />}

        {currentPage === "batches" && <Batches />}

        {currentPage === "fees" && <Fees />}
      </main>

    </div>
  );
}

export default App;