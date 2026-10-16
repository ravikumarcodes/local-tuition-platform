const express = require("express");
const prisma = require("./lib/prisma");
const { Prisma } = require("@prisma/client");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Weekday names ko JavaScript Date ke day numbers se map kar rahe hain
const dayNameToNumber = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Month ke andar batch ke scheduled class dates calculate kar rahe hain
function getTuitionDays(year, month, days) {
  // Batch ke scheduled days ko normalize karke array mein convert kar rahe hain
  // Example: "Mon, Wed, Fri" -> ["Mon", "Wed", "Fri"]
  const dayList = Array.isArray(days)
    ? days
    : typeof days === "string"
      ? days.split(",")
      : [];

  const scheduledDays = dayList
    .map((day) => String(day).trim())
    .filter(Boolean)
    .map((day) => {
      const normalizedDay =
        day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

      return dayNameToNumber[normalizedDay];
    })
    .filter((day) => day !== undefined);

  // Agar valid scheduled days nahi mile
  if (scheduledDays.length === 0) {
    return [];
  }

  // Selected month mein total days calculate kar rahe hain
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const tuitionDates = [];

  // Selected month ki har date check kar rahe hain
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(year, month - 1, day);

    // Agar date batch ke scheduled day par hai
    if (scheduledDays.includes(date.getDay())) {
      tuitionDates.push(date);
    }
  }

  return tuitionDates;
}

// Check kar rahe hain ki class date student ke enrollment period ke andar hai
function isApplicableDate(date, joinedAt, leftAt) {
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);

  const joinedDate = new Date(joinedAt);
  joinedDate.setHours(0, 0, 0, 0);

  // Joining date se pehle ki class applicable nahi hai
  if (currentDate < joinedDate) {
    return false;
  }

  // Agar student leave kar chuka hai
  if (leftAt) {
    const leftDate = new Date(leftAt);
    leftDate.setHours(0, 0, 0, 0);

    // Leaving date ke baad ki class applicable nahi hai
    if (currentDate > leftDate) {
      return false;
    }
  }

  return true;
}

// Month/year ko safely resolve kar rahe hain
// Agar frontend se nahi aaye to current month/year use hoga
function getSelectedMonthYear(month, year) {
  const currentDate = new Date();

  const selectedMonth =
    month !== undefined && month !== null && month !== ""
      ? Number(month)
      : currentDate.getMonth() + 1;

  const selectedYear =
    year !== undefined && year !== null && year !== ""
      ? Number(year)
      : currentDate.getFullYear();

  return {
    selectedMonth,
    selectedYear,
  };
}

// Month/year validate kar rahe hain
function validateMonthYear(month, year) {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return "Month must be between 1 and 12";
  }

  if (
    !Number.isInteger(year) ||
    year < 2000
  ) {
    return "Valid year is required";
  }

  return null;
}

// Date ko safely validate karne ke liye helper
function isValidDate(value) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

// ============================================================
// HEALTH API
// ============================================================

// Health API: Check server and database
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Local Tuition API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("HEALTH CHECK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ============================================================
// TEACHER APIs
// ============================================================

// Create Teacher: User + TeacherProfile
app.post("/api/teacher", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      passwordHash,
      qualification,
      experienceYears,
      bio,
      locality,
      city,
      teachingMode,
    } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof passwordHash !== "string" ||
      !passwordHash.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and password are required",
      });
    }

    // Experience years ko number mein convert kar rahe hain
    let parsedExperienceYears = null;

    if (
      experienceYears !== undefined &&
      experienceYears !== null &&
      experienceYears !== ""
    ) {
      parsedExperienceYears = Number(experienceYears);

      if (
        !Number.isInteger(parsedExperienceYears) ||
        parsedExperienceYears < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Experience years must be a valid non-negative integer",
        });
      }
    }

    // Create User and TeacherProfile together
    const teacher = await prisma.user.create({
      data: {
        name: name.trim(),
        email:
          typeof email === "string" && email.trim()
            ? email.trim()
            : null,
        phone:
          typeof phone === "string" && phone.trim()
            ? phone.trim()
            : null,
        passwordHash: passwordHash.trim(),
        role: "TEACHER",

        teacherProfile: {
          create: {
            qualification:
              typeof qualification === "string" && qualification.trim()
                ? qualification.trim()
                : null,

            experienceYears: parsedExperienceYears,

            bio:
              typeof bio === "string" && bio.trim()
                ? bio.trim()
                : null,

            locality:
              typeof locality === "string" && locality.trim()
                ? locality.trim()
                : null,

            city:
              typeof city === "string" && city.trim()
                ? city.trim()
                : null,

            teachingMode:
              typeof teachingMode === "string" && teachingMode.trim()
                ? teachingMode.trim()
                : null,
          },
        },
      },

      // Include TeacherProfile in the response
      include: {
        teacherProfile: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: error.message,
    });
  }
});

// Get all teachers
app.get("/api/teachers", async (req, res) => {
  try {
    // Fetch teachers along with their profile
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },

      include: {
        teacherProfile: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
      error: error.message,
    });
  }
});

// ============================================================
// STUDENT APIs
// ============================================================

// Create Student: POST /api/students
app.post("/api/students", async (req, res) => {
  try {
    const {
      name,
      className,
      teacherId,
      dateOfBirth,
      gender,
      schoolName,
      board,
      phone,
      status,
    } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof className !== "string" ||
      !className.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and class are required",
      });
    }

    // Date of birth validate kar rahe hain
    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dateOfBirth",
      });
    }

    // Create student and connect it to the teacher
    const student = await prisma.studentProfile.create({
      data: {
        name: name.trim(),

        className: className.trim(),

        teacherId:
          typeof teacherId === "string" && teacherId.trim()
            ? teacherId.trim()
            : null,

        dateOfBirth:
          dateOfBirth
            ? new Date(dateOfBirth)
            : null,

        gender:
          typeof gender === "string" && gender.trim()
            ? gender.trim()
            : null,

        schoolName:
          typeof schoolName === "string" && schoolName.trim()
            ? schoolName.trim()
            : null,

        board:
          typeof board === "string" && board.trim()
            ? board.trim()
            : null,

        phone:
          typeof phone === "string" && phone.trim()
            ? phone.trim()
            : null,

        status: status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
});

// Get Students: GET /api/students
app.get("/api/students", async (req, res) => {
  try {
    // Students ke saath unka teacher bhi database se fetch kar rahe hain
    const students = await prisma.studentProfile.findMany({
      include: {
        teacher: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
});

// Update Student
app.put("/api/students/:id", async (req, res) => {
  try {
    const {
      name,
      className,
      teacherId,
      dateOfBirth,
      gender,
      schoolName,
      board,
      phone,
      status,
    } = req.body;

    // Update student details and assign teacher
    const student = await prisma.studentProfile.update({
      where: {
        id: req.params.id,
      },

      data: {
        ...(name !== undefined && {
          name: String(name).trim(),
        }),

        ...(className !== undefined && {
          className: String(className).trim(),
        }),

        ...(teacherId !== undefined && {
          teacherId:
            teacherId && String(teacherId).trim()
              ? String(teacherId).trim()
              : null,
        }),

        ...(dateOfBirth !== undefined && {
          dateOfBirth:
            dateOfBirth
              ? new Date(dateOfBirth)
              : null,
        }),

        ...(gender !== undefined && {
          gender:
            gender && String(gender).trim()
              ? String(gender).trim()
              : null,
        }),

        ...(schoolName !== undefined && {
          schoolName:
            schoolName && String(schoolName).trim()
              ? String(schoolName).trim()
              : null,
        }),

        ...(board !== undefined && {
          board:
            board && String(board).trim()
              ? String(board).trim()
              : null,
        }),

        ...(phone !== undefined && {
          phone:
            phone && String(phone).trim()
              ? String(phone).trim()
              : null,
        }),

        ...(status !== undefined && {
          status,
        }),
      },
    });

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    // Show the actual Prisma error in terminal
    console.error("UPDATE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
});

// Delete Student: DELETE /api/students/:id
app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await prisma.studentProfile.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Student deleted successfully",
      data: student,
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
});

// ============================================================
// SUBJECT APIs
// ============================================================

// Create Subject: POST /api/subjects
app.post("/api/subjects", async (req, res) => {
  try {
    // Request body se subject ka naam le rahe hain
    const { name } = req.body;

    // Subject name required hai
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    // Database mein naya subject create kar rahe hain
    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
      },
    });

    // Created subject client ko return kar rahe hain
    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("CREATE SUBJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create subject",
      error: error.message,
    });
  }
});

// Get all Subjects: GET /api/subjects
app.get("/api/subjects", async (req, res) => {
  try {
    // Database se saare subjects fetch kar rahe hain
    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: error.message,
    });
  }
});

// ============================================================
// BATCH APIs
// ============================================================

// Create Batch: POST /api/batches
app.post("/api/batches", async (req, res) => {
  try {
    // Request se batch ki information le rahe hain
    const {
      teacherId,
      subjectId,
      name,
      className,
      startTime,
      endTime,
      days,
      maxStudents,
    } = req.body;

    // Required fields check kar rahe hain
    if (
      !teacherId ||
      !subjectId ||
      !name ||
      !startTime ||
      !endTime ||
      !days
    ) {
      return res.status(400).json({
        success: false,
        message:
          "teacherId, subjectId, name, startTime, endTime and days are required",
      });
    }

    // Batch days ko database ke String format mein convert kar rahe hain
    const normalizedDays = Array.isArray(days)
      ? days
          .map((day) => String(day).trim())
          .filter(Boolean)
          .join(", ")
      : String(days).trim();

    if (!normalizedDays) {
      return res.status(400).json({
        success: false,
        message: "At least one valid batch day is required",
      });
    }

    // Max students ko number mein convert kar rahe hain
    let parsedMaxStudents = null;

    if (
      maxStudents !== undefined &&
      maxStudents !== null &&
      maxStudents !== ""
    ) {
      parsedMaxStudents = Number(maxStudents);

      if (
        !Number.isInteger(parsedMaxStudents) ||
        parsedMaxStudents <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "maxStudents must be a positive integer",
        });
      }
    }

    // Database mein batch create kar rahe hain
    const batch = await prisma.batch.create({
      data: {
        teacherId: String(teacherId).trim(),
        subjectId: String(subjectId).trim(),
        name: String(name).trim(),

        className:
          className && String(className).trim()
            ? String(className).trim()
            : null,

        startTime: String(startTime).trim(),
        endTime: String(endTime).trim(),

        days: normalizedDays,

        maxStudents: parsedMaxStudents,
      },

      // Response mein teacher aur subject ka data bhi chahiye
      include: {
        teacher: true,
        subject: true,
      },
    });

    // Successfully created batch return kar rahe hain
    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    console.error("CREATE BATCH ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message,
    });
  }
});

// Get all Batches: GET /api/batches
app.get("/api/batches", async (req, res) => {
  try {
    // Database se saare batches fetch kar rahe hain
    const batches = await prisma.batch.findMany({
      include: {
        teacher: true,
        subject: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("GET BATCHES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
      error: error.message,
    });
  }
});

// ============================================================
// ENROLLMENT APIs
// ============================================================

// Create Enrollment: POST /api/enrollments
app.post("/api/enrollments", async (req, res) => {
  try {
    const {
      teacherId,
      studentId,
      batchId,
      joinedAt,
      leftAt,
      monthlyFee,
      status,
    } = req.body;

    // Required fields check kar rahe hain
    if (
      !teacherId ||
      !studentId ||
      !batchId ||
      !joinedAt ||
      monthlyFee === undefined ||
      monthlyFee === null ||
      monthlyFee === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "teacherId, studentId, batchId, joinedAt and monthlyFee are required",
      });
    }

    // Joining date validate kar rahe hain
    if (!isValidDate(joinedAt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid joinedAt date",
      });
    }

    // Leaving date validate kar rahe hain
    if (leftAt && !isValidDate(leftAt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leftAt date",
      });
    }

    const parsedJoinedAt = new Date(joinedAt);
    const parsedLeftAt = leftAt
      ? new Date(leftAt)
      : null;

    // Left date joining date se pehle nahi honi chahiye
    if (
      parsedLeftAt &&
      parsedLeftAt < parsedJoinedAt
    ) {
      return res.status(400).json({
        success: false,
        message: "leftAt cannot be before joinedAt",
      });
    }

    const parsedMonthlyFee = Number(monthlyFee);

    // Monthly fee validate kar rahe hain
    if (
      !Number.isFinite(parsedMonthlyFee) ||
      parsedMonthlyFee < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Monthly fee must be a valid non-negative number",
      });
    }

    // Database mein enrollment create kar rahe hain
    const enrollment = await prisma.enrollment.create({
      data: {
        teacherId: String(teacherId).trim(),
        studentId: String(studentId).trim(),
        batchId: String(batchId).trim(),

        joinedAt: parsedJoinedAt,

        leftAt: parsedLeftAt,

        monthlyFee: parsedMonthlyFee,

        status: status || "ACTIVE",
      },

      include: {
        student: true,

        batch: {
          include: {
            subject: true,
          },
        },

        teacher: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Enrollment created successfully",
      data: enrollment,
    });
  } catch (error) {
    console.error("CREATE ENROLLMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create enrollment",
      error: error.message,
    });
  }
});

// Get all Enrollments: GET /api/enrollments
app.get("/api/enrollments", async (req, res) => {
  try {
    // Database se saare enrollments fetch kar rahe hain
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: true,

        batch: {
          include: {
            subject: true,
          },
        },

        teacher: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error("GET ENROLLMENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
      error: error.message,
    });
  }
});

// Get Student Enrollments: GET /api/students/:studentId/enrollments
app.get(
  "/api/students/:studentId/enrollments",
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Student ke saare enrollments fetch kar rahe hain
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId,
        },

        include: {
          batch: {
            include: {
              subject: true,
            },
          },

          teacher: true,
        },

        orderBy: {
          joinedAt: "desc",
        },
      });

      res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      console.error(
        "GET STUDENT ENROLLMENTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch student enrollments",
        error: error.message,
      });
    }
  }
);

// ============================================================
// FEE RECORD APIs
// ============================================================

// Generate Fee Records: POST /api/fee-records/generate
app.post("/api/fee-records/generate", async (req, res) => {
  try {
    const { month, year } = req.body;

    // Agar month/year frontend se nahi aaye,
    // to current month/year automatically use karenge
    const {
      selectedMonth,
      selectedYear,
    } = getSelectedMonthYear(month, year);

    // Month/year validate kar rahe hain
    const validationError = validateMonthYear(
      selectedMonth,
      selectedYear
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Active enrollments fetch kar rahe hain
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
      },

      include: {
        student: true,

        batch: {
          include: {
            subject: true,
          },
        },

        teacher: true,
      },
    });

    const generatedFeeRecords = [];

    // Har active enrollment ke liye fee calculate kar rahe hain
    for (const enrollment of enrollments) {
      const { batch, student } = enrollment;

      // Batch ke scheduled tuition dates calculate kar rahe hain
      const tuitionDates = getTuitionDays(
        selectedYear,
        selectedMonth,
        batch.days
      );

      const totalTuitionDays =
        tuitionDates.length;

      // Agar month mein batch ki koi class hi nahi hai
      // to fee record generate nahi karenge
      if (totalTuitionDays === 0) {
        continue;
      }

      // Student ke enrollment period ke according applicable dates
      const applicableDates = tuitionDates.filter(
        (date) =>
          isApplicableDate(
            date,
            enrollment.joinedAt,
            enrollment.leftAt
          )
      );

      const applicableDays =
        applicableDates.length;

      // Agar student is month mein applicable nahi tha
      // to fee record generate nahi karenge
      if (applicableDays === 0) {
        continue;
      }

      // Monthly fee database se aa rahi hai
      const monthlyFee = new Prisma.Decimal(
        enrollment.monthlyFee
      );

      // Monthly fee valid honi chahiye
      if (
       !monthlyFee.isFinite() ||
        monthlyFee.lt(0)
      ) {
        continue;
      }

      // Applicable days ke basis par fee calculate kar rahe hain
      const calculatedAmount = monthlyFee
      .mul(applicableDays)
      .div(totalTuitionDays)
      .toDecimalPlaces(2);

      // Check kar rahe hain ki is enrollment ka
      // selected month/year ka fee record already exist karta hai ya nahi
      const existingFeeRecord =
        await prisma.feeRecord.findUnique({
          where: {
            enrollmentId_month_year: {
              enrollmentId: enrollment.id,
              month: selectedMonth,
              year: selectedYear,
            },
          },
        });

      // Existing record ko dobara create nahi karenge
      if (existingFeeRecord) {
        continue;
      }

      // Naya fee record create kar rahe hain
      const feeRecord =
        await prisma.feeRecord.create({
          data: {
            enrollmentId: enrollment.id,
            studentId: student.id,

            // Calendar se selected month/year
            month: selectedMonth,
            year: selectedYear,

            monthlyFee: monthlyFee,

            totalTuitionDays,

            applicableDays,

            calculatedAmount: calculatedAmount,

            // Abhi koi adjustment nahi hai
            adjustmentAmount: "0.00",

            // Initial approved amount
            approvedAmount: calculatedAmount,

            // Abhi payment nahi hui hai
            paidAmount: "0.00",

            // Initial fee status
            status: "PENDING",
          },

          // Response mein useful related data bhi return kar rahe hain
          include: {
            student: true,

            enrollment: {
              include: {
                batch: {
                  include: {
                    subject: true,
                  },
                },

                teacher: true,
              },
            },

            transactions: true,
          },
        });

      generatedFeeRecords.push(
        feeRecord
      );
    }

    res.status(201).json({
      success: true,
      message:
        "Fee records generated successfully",

      month: selectedMonth,

      year: selectedYear,

      count: generatedFeeRecords.length,

      data: generatedFeeRecords,
    });
  } catch (error) {
    console.error(
      "GENERATE FEE RECORDS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate fee records",
      error: error.message,
    });
  }
});

// Get Fee Records: GET /api/fee-records
app.get("/api/fee-records", async (req, res) => {
  try {
    const {
      month,
      year,
      enrollmentId,
    } = req.query;

    // Agar month/year frontend se nahi aaye,
    // to current month/year automatically use karenge
    const {
      selectedMonth,
      selectedYear,
    } = getSelectedMonthYear(
      month,
      year
    );

    // Month/year validate kar rahe hain
    const validationError =
      validateMonthYear(
        selectedMonth,
        selectedYear
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Fee records ke liye basic filter
    const whereCondition = {
      month: selectedMonth,
      year: selectedYear,
    };

    // Agar enrollmentId diya gaya hai,
    // to us enrollment ka record bhi filter karenge
    if (
      typeof enrollmentId === "string" &&
      enrollmentId.trim()
    ) {
      whereCondition.enrollmentId =
        enrollmentId.trim();
    }

    // Database se selected month/year ke fee records fetch kar rahe hain
    const feeRecords =
      await prisma.feeRecord.findMany({
        where: whereCondition,

        // Response mein student aur enrollment ki useful information
        include: {
          student: true,

          enrollment: {
            include: {
              batch: {
                include: {
                  subject: true,
                },
              },

              teacher: true,
            },
          },

          transactions: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    res.json({
      success: true,
      data: feeRecords,
    });
  } catch (error) {
    console.error(
      "GET FEE RECORDS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch fee records",
      error: error.message,
    });
  }
});

// ============================================================
// FEE PAYMENT / TRANSACTION APIs
// ============================================================

// Add Fee Payment: POST /api/fee-transactions
app.post(
  "/api/fee-transactions",
  async (req, res) => {
    try {
      const {
        feeRecordId,
        studentId,
        amount,
        paymentDate,
        paymentMethod,
        referenceNo,
        note,
      } = req.body;

      // Required fields validate kar rahe hain
      if (
        !feeRecordId ||
        !studentId ||
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !paymentMethod
      ) {
        return res.status(400).json({
          success: false,
          message:
            "feeRecordId, studentId, amount and paymentMethod are required",
        });
      }

      const paymentAmount = new Prisma.Decimal(amount);

      // Payment amount validate kar rahe hain
      if (!paymentAmount.isFinite() || paymentAmount.lte(0)) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount must be greater than 0",
        });
      }

      // Payment date validate kar rahe hain
      if (
        paymentDate &&
        !isValidDate(paymentDate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paymentDate",
        });
      }

      // Fee record fetch kar rahe hain
      const feeRecord =
        await prisma.feeRecord.findUnique({
          where: {
            id: feeRecordId,
          },

          include: {
            transactions: true,
          },
        });

      if (!feeRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Fee record not found",
        });
      }

      // Payment jis student ki hai,
      // usi student ke fee record ka hona verify kar rahe hain
      if (
        feeRecord.studentId !== studentId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Fee record does not belong to the provided student",
        });
      }

      // Current paid amount calculate kar rahe hain
      const currentPaidAmount =
        Number(
          feeRecord.paidAmount
        );

      const approvedAmount =
        Number(
          feeRecord.approvedAmount
        );

      const remainingAmount =
        Number(
          (
            approvedAmount -
            currentPaidAmount
          ).toFixed(2)
        );

      // Agar fee already completely paid hai
      if (remainingAmount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "This fee record is already fully paid",
        });
      }

      // Remaining amount se zyada payment allow nahi kar rahe
      if (
        paymentAmount >
        remainingAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Payment cannot be greater than remaining amount of ${remainingAmount}`,
        });
      }

      // New transaction create kar rahe hain
      const transaction =
        await prisma.feeTransaction.create({
          data: {
            feeRecordId,

            studentId,

            amount:
              paymentAmount,

            paymentDate:
              paymentDate
                ? new Date(
                    paymentDate
                  )
                : new Date(),

            paymentMethod,

            referenceNo:
              referenceNo &&
              String(
                referenceNo
              ).trim()
                ? String(
                    referenceNo
                  ).trim()
                : null,

            note:
              note &&
              String(note).trim()
                ? String(note).trim()
                : null,
          },
        });

      // New total paid amount calculate kar rahe hain
      const newPaidAmount =
        Number(
          (
            currentPaidAmount +
            paymentAmount
          ).toFixed(2)
        );

      // Payment status automatically calculate kar rahe hain
      let newStatus =
        "PARTIAL";

      if (
        newPaidAmount >=
        approvedAmount
      ) {
        newStatus =
          "PAID";
      }

      // Fee record update kar rahe hain
      const updatedFeeRecord =
        await prisma.feeRecord.update({
          where: {
            id: feeRecordId,
          },

          data: {
            paidAmount:
              newPaidAmount.toFixed(
                2
              ),

            status:
              newStatus,
          },

          include: {
            student: true,

            transactions: true,

            enrollment: {
              include: {
                batch: {
                  include: {
                    subject: true,
                  },
                },

                teacher: true,
              },
            },
          },
        });

      res.status(201).json({
        success: true,
        message:
          "Fee payment recorded successfully",

        data: {
          transaction,

          feeRecord:
            updatedFeeRecord,
        },
      });
    } catch (error) {
      console.error(
        "CREATE FEE TRANSACTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to record fee payment",
        error: error.message,
      });
    }
  }
);

// Record Fee Payment: POST /api/fee-records/:id/payment
app.post("/api/fee-records/:id/payment", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      amount,
      paymentMethod,
      paymentDate,
      referenceNo,
      note,
    } = req.body;

    // Amount validate kar rahe hain
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    // Payment method validate kar rahe hain
    const allowedPaymentMethods = [
      "CASH",
      "UPI",
      "BANK_TRANSFER",
      "CARD",
      "OTHER",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Allowed values: ${allowedPaymentMethods.join(
          ", "
        )}`,
      });
    }

    // Fee record database se fetch kar rahe hain
    const feeRecord = await prisma.feeRecord.findUnique({
      where: {
        id,
      },
      include: {
        student: true,
        enrollment: {
          include: {
            batch: {
              include: {
                subject: true,
              },
            },
            teacher: true,
          },
        },
        transactions: true,
      },
    });

    // Fee record exist karta hai ya nahi
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    // Decimal ko number mein convert kar rahe hain
    const approvedAmount = new Prisma.Decimal(
  feeRecord.approvedAmount
);

const alreadyPaidAmount = new Prisma.Decimal(
  feeRecord.paidAmount
);

    // Abhi kitna amount pending hai
    const remainingAmount = approvedAmount.minus(alreadyPaidAmount);

    // Agar fee already completely paid hai
    if (remainingAmount.lte(0)) {
      return res.status(400).json({
        success: false,
        message: "This fee record is already fully paid",
      });
    }

    // Remaining amount se zyada payment allow nahi karenge
    if (paymentAmount.gt(remainingAmount)) {
      return res.status(400).json({
        success: false,
        message: `Payment cannot exceed remaining amount of ${remainingAmount.toFixed(
          2
        )}`,
      });
    }

    // Payment date optional hai
    // Agar nahi di gayi to current date use hogi
    const finalPaymentDate = paymentDate
      ? new Date(paymentDate)
      : new Date();

    // Invalid date check
    if (Number.isNaN(finalPaymentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment date",
      });
    }

    // New paid amount calculate kar rahe hain
const newPaidAmount = alreadyPaidAmount.plus(paymentAmount);

// New fee status calculate kar rahe hain
let newStatus;

if (newPaidAmount.eq(approvedAmount)) {
  newStatus = "PAID";
} else if (
  newPaidAmount.gt(0) &&
  newPaidAmount.lt(approvedAmount)
) {
  newStatus = "PARTIAL";
} else {
  newStatus = "PENDING";
}

    // Transaction + FeeRecord update ek hi database transaction mein
    const result = await prisma.$transaction(async (tx) => {
      // Payment transaction create kar rahe hain
      const transaction = await tx.feeTransaction.create({
        data: {
          feeRecordId: feeRecord.id,
          studentId: feeRecord.studentId,
          amount: paymentAmount,
          paymentDate: finalPaymentDate,
          paymentMethod,
          referenceNo: referenceNo?.trim() || null,
          note: note?.trim() || null,
        },
      });

      // Fee record update kar rahe hain
      const updatedFeeRecord = await tx.feeRecord.update({
        where: {
          id: feeRecord.id,
        },

        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },

        include: {
          student: true,

          enrollment: {
            include: {
              batch: {
                include: {
                  subject: true,
                },
              },
              teacher: true,
            },
          },

          transactions: {
            orderBy: {
              paymentDate: "desc",
            },
          },
        },
      });

      return {
        transaction,
        feeRecord: updatedFeeRecord,
      };
    });

    res.status(201).json({
      success: true,
      message: "Fee payment recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("RECORD FEE PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record fee payment",
      error: error.message,
    });
  }
});

// One-time fix for incorrect fee status
app.patch("/api/fee-records/:id/fix-status", async (req, res) => {
  try {
    const { id } = req.params;

    const feeRecord = await prisma.feeRecord.findUnique({
      where: {
        id,
      },
      include: {
        transactions: true,
      },
    });

    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    // Actual transactions se total paid amount calculate
    const totalPaidAmount = feeRecord.transactions.reduce(
      (total, transaction) => {
        return total.plus(new Prisma.Decimal(transaction.amount));
      },
      new Prisma.Decimal(0)
    );

    const approvedAmount = new Prisma.Decimal(
      feeRecord.approvedAmount
    );

    let newStatus;

    if (totalPaidAmount.gte(approvedAmount)) {
      newStatus = "PAID";
    } else if (
      totalPaidAmount.gt(0) &&
      totalPaidAmount.lt(approvedAmount)
    ) {
      newStatus = "PARTIAL";
    } else {
      newStatus = "PENDING";
    }

    const updatedFeeRecord = await prisma.feeRecord.update({
      where: {
        id,
      },
      data: {
        paidAmount: totalPaidAmount,
        status: newStatus,
      },
    });

    res.json({
      success: true,
      message: "Fee status corrected successfully",
      data: updatedFeeRecord,
    });
  } catch (error) {
    console.error("FIX FEE STATUS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fix fee status",
      error: error.message,
    });
  }
});
// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});