function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="sidebar">

      <div className="brand">
        <h2>RK Tuition Classes</h2>
        <p>Teacher Dashboard</p>
      </div>

      <nav className="sidebar-nav">

        <button
          className={`nav-item ${
            currentPage === "dashboard" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button
          className={`nav-item ${
            currentPage === "students" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("students")}
        >
          👨‍🎓 Students
        </button>

        <button
          className={`nav-item ${
            currentPage === "batches" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("batches")}
        >
          📚 Batches
        </button>

        <button className="nav-item">
          ₹ Fees
        </button>

        <button className="nav-item">
          📅 Attendance
        </button>

        <button className="nav-item">
          📝 Homework
        </button>

        <button className="nav-item">
          📋 Tests
        </button>

        <button className="nav-item">
          📖 Subjects
        </button>

        <button className="nav-item">
          📊 Reports
        </button>

        <button className="nav-item">
          ⚙️ Settings
        </button>

      </nav>

      <div className="teacher-box">

        <div className="teacher-avatar">
          R
        </div>

        <div>
          <strong>Teacher</strong>
          <p>RK Tuition Classes</p>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;