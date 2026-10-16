import { useEffect, useState } from "react";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    className: "",
    phone: "",
    gender: "",
    schoolName: "",
    board: "",
  });

  useEffect(() => {
    loadStudents();
  }, []);
  async function handleAddStudent() {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Test Student",
            className: "8",
            phone: "9876543210",
            gender: "Male",
            schoolName: "Test School",
            board: "CBSE",
            status: "ACTIVE",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create student");
      }

      console.log("STUDENT CREATED:", result);

      await loadStudents();

    } catch (error) {
      console.error("ADD STUDENT ERROR:", error);

      setError(
        error.message || "Student add nahi ho pa raha."
      );
    }
  }
  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/students"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const result = await response.json();

      setStudents(
        Array.isArray(result.data)
          ? result.data
          : []
      );

    } catch (error) {
      console.error("STUDENTS ERROR:", error);

      setError(
        "Students load nahi ho pa rahe. Make sure backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create student"
        );
      }

      // New student ko list ke beginning mein add karo
      setStudents((previousStudents) => [
        result.data,
        ...previousStudents,
      ]);

      // Form reset
      setFormData({
        name: "",
        className: "",
        phone: "",
        gender: "",
        schoolName: "",
        board: "",
      });

      // Form close
      setShowForm(false);

    } catch (error) {
      console.error("CREATE STUDENT ERROR:", error);

      setError(
        error.message || "Student create nahi ho pa raha."
      );
    }
  }
  return (
    <div className="students-page">

      <div className="page-header">

        <div>
          <h1>Students</h1>
          <p>Manage your tuition students.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          + Add Student
        </button>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {showForm && (
        <div className="dashboard-card">

          <div className="card-header">
            <h2>➕ Add New Student</h2>

            <button
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="student-form">

              <div className="form-group">
                <label>Student Name *</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                />
              </div>


              <div className="form-group">
                <label>Class *</label>

                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  placeholder="Example: 7"
                />
              </div>


              <div className="form-group">
                <label>Phone</label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>


              <div className="form-group">
                <label>Gender</label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>


              <div className="form-group">
                <label>School Name</label>

                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="Enter school name"
                />
              </div>


              <div className="form-group">
                <label>Board</label>

                <select
                  name="board"
                  value={formData.board}
                  onChange={handleChange}
                >
                  <option value="">Select board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="UP BOARD">UP Board</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Save Student
              </button>

            </div>
          </form>
        </div>
      )}

      <div className="dashboard-card">

        <div className="card-header">

          <h2>
            👨‍🎓 All Students
          </h2>

          <span>
            {loading ? "Loading..." : `${students.length} Students`}
          </span>

        </div>


        {loading ? (

          <p>Loading students...</p>

        ) : students.length === 0 ? (

          <p>
            No students found.
          </p>

        ) : (

          <div className="student-table">

            <div className="table-row table-heading">

              <span>#</span>
              <span>Name</span>
              <span>Class</span>
              <span>Status</span>
              <span>Phone</span>

            </div>


            {students.map((student, index) => (

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
                  {student.status || "-"}
                </span>

                <span>
                  {student.phone || "-"}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Students;