import { useEffect, useState } from "react";

function Dashboard() {
  // =========================
  // Dashboard State
  // =========================

  const [totalStudents, setTotalStudents] = useState(0);
  const [activeBatches, setActiveBatches] = useState(0);
  const [recentStudents, setRecentStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // Current Date
  // =========================

  const currentDate = new Date();

  const currentMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  const currentYear = currentDate.getFullYear();

  // =========================
  // Load Dashboard Data
  // =========================

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      // =========================
      // Students API
      // =========================

      const studentsResponse = await fetch(
        "http://localhost:5000/api/students"
      );

      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students");
      }

      const studentsResult = await studentsResponse.json();

      const students = Array.isArray(studentsResult.data)
        ? studentsResult.data
        : [];

      // Active students count
      const activeStudents = students.filter(
        (student) => student.status === "ACTIVE"
      );

      setTotalStudents(activeStudents.length);

      // Recent 5 students
      const recentStudentsList = [...students]
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )
        .slice(0, 5);

      setRecentStudents(recentStudentsList);

      // =========================
      // Batches API
      // =========================

      const batchesResponse = await fetch(
        "http://localhost:5000/api/batches"
      );

      if (!batchesResponse.ok) {
        throw new Error("Failed to fetch batches");
      }

      const batchesResult = await batchesResponse.json();

      const batches = Array.isArray(batchesResult.data)
        ? batchesResult.data
        : [];

      // Active batches count
      const activeBatchList = batches.filter(
        (batch) => batch.isActive === true
      );

      setActiveBatches(activeBatchList.length);

    } catch (error) {
      console.error("DASHBOARD ERROR:", error);

      setError(
        "Dashboard data load nahi ho pa raha. Make sure backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* =========================
          Topbar
      ========================= */}

      <header className="topbar">

        <div className="search-box">

          🔍

          <input
            type="text"
            placeholder="Search students, batches..."
          />

        </div>

        <div className="topbar-right">

          <span className="notification">
            🔔
          </span>

          <div className="profile">

            <div className="profile-avatar">
              R
            </div>

            <span>
              Teacher
            </span>

            <span>
              ⌄
            </span>

          </div>

        </div>

      </header>


      {/* =========================
          Dashboard Header
      ========================= */}

      <section className="dashboard-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Welcome back! Here's what's happening with your tuition classes.
          </p>

        </div>

        <div className="date-box">

          📅

          <div>

            <strong>
              {currentMonth} {currentYear}
            </strong>

            <span>
              Today
            </span>

          </div>

        </div>

      </section>


      {/* =========================
          Error Message
      ========================= */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}


      {/* =========================
          Stats
      ========================= */}

      <section className="stats-grid">

        {/* Total Students */}

        <div className="stat-card students-card">

          <div className="stat-icon">
            👥
          </div>

          <div>

            <p>
              Total Students
            </p>

            <h2>
              {loading ? "..." : totalStudents}
            </h2>

            <span>
              Active students
            </span>

          </div>

        </div>


        {/* Active Batches */}

        <div className="stat-card batches-card">

          <div className="stat-icon">
            📚
          </div>

          <div>

            <p>
              Active Batches
            </p>

            <h2>
              {loading ? "..." : activeBatches}
            </h2>

            <span>
              Currently active
            </span>

          </div>

        </div>


        {/* Fees Collected */}

        <div className="stat-card fees-card">

          <div className="stat-icon">
            ₹
          </div>

          <div>

            <p>
              Fees Collected
            </p>

            <h2>
              ₹18,500
            </h2>

            <span>
              This month
            </span>

          </div>

        </div>


        {/* Pending Fees */}

        <div className="stat-card pending-card">

          <div className="stat-icon">
            ◷
          </div>

          <div>

            <p>
              Pending Fees
            </p>

            <h2>
              ₹6,000
            </h2>

            <span>
              This month
            </span>

          </div>

        </div>

      </section>


      {/* =========================
          Main Dashboard Grid
      ========================= */}

      <section className="dashboard-grid">


        {/* =========================
            Recent Students
        ========================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>
                👨‍🎓 Recent Students
              </h2>
            </div>

            <button>
              View All
            </button>

          </div>


          <div className="student-table">

            <div className="table-row table-heading">

              <span>#</span>

              <span>Name</span>

              <span>Class</span>

              <span>Batch</span>

              <span>Joining Date</span>

            </div>


            {recentStudents.map((student, index) => (

              <div
                className="table-row"
                key={student.id}
              >

                <span>
                  {index + 1}
                </span>

                <span>
                  {student.name}
                </span>

                <span>
                  {student.className || "-"}
                </span>

                <span>
                  -
                </span>

                <span>

                  {student.createdAt
                    ? new Date(
                        student.createdAt
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}

                </span>

              </div>

            ))}

          </div>

        </div>


        {/* =========================
            Upcoming Classes
        ========================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              📅 Upcoming Classes
            </h2>

            <button>
              View All
            </button>

          </div>


          <div className="class-list">

            <div className="class-row">

              <strong>
                4:00 PM
              </strong>

              <span>
                Batch A
              </span>

              <span>
                Class 7 & 8
              </span>

              <b>
                12
              </b>

            </div>


            <div className="class-row">

              <strong>
                6:00 PM
              </strong>

              <span>
                Batch B
              </span>

              <span>
                Class 5 & 6
              </span>

              <b>
                14
              </b>

            </div>


            <div className="class-row">

              <strong>
                7:00 PM
              </strong>

              <span>
                Batch C
              </span>

              <span>
                Class 7
              </span>

              <b>
                10
              </b>

            </div>


            <div className="class-row">

              <strong>
                8:00 PM
              </strong>

              <span>
                Batch D
              </span>

              <span>
                Class 8
              </span>

              <b>
                9
              </b>

            </div>

          </div>

        </div>


        {/* =========================
            Fee Status
        ========================= */}

        <div className="dashboard-card fee-status">

          <div className="card-header">

            <h2>
              📊 Fee Status
            </h2>

            <select>

              <option>
                This Month
              </option>

              <option>
                Last Month
              </option>

            </select>

          </div>


          <div className="fee-summary">

            <div>

              <span>
                Collected
              </span>

              <strong>
                ₹18,500
              </strong>

            </div>


            <div>

              <span>
                Pending
              </span>

              <strong>
                ₹6,000
              </strong>

            </div>


            <div>

              <span>
                Total
              </span>

              <strong>
                ₹24,500
              </strong>

            </div>

          </div>


          <div className="progress-bar">

            <div className="progress"></div>

          </div>


          <p className="collection-text">
            76% collected
          </p>

        </div>


        {/* =========================
            Quick Actions
        ========================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              ⚡ Quick Actions
            </h2>

          </div>


          <div className="quick-actions">

            <button>

              <strong>
                👤 Add Student
              </strong>

              <span>
                Register a new student
              </span>

            </button>


            <button>

              <strong>
                📚 Create Batch
              </strong>

              <span>
                Add a new batch
              </span>

            </button>


            <button>

              <strong>
                ₹ Collect Fee
              </strong>

              <span>
                Record a payment
              </span>

            </button>


            <button>

              <strong>
                📝 Add Homework
              </strong>

              <span>
                Assign homework
              </span>

            </button>

          </div>

        </div>

      </section>
    </>
  );
}

export default Dashboard;