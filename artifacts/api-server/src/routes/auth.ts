import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { studentsTable, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router();

// POST /auth/student/register
router.post("/student/register", async (req, res) => {
  try {
    const { fullName, schoolEmail, password, confirmPassword, matricNumber, level } = req.body;

    // Validate required fields
    if (!fullName || !schoolEmail || !password || !confirmPassword || !matricNumber || !level) {
      res.status(400).json({ error: "Validation", message: "All fields are required" });
      return;
    }

    // Validate school email domain
    if (!schoolEmail.endsWith("@trinityuniversity.edu.ng")) {
      res.status(400).json({ error: "Validation", message: "School email must end with @trinityuniversity.edu.ng" });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Validation", message: "Passwords do not match" });
      return;
    }

    // Validate matric number format
    const matricRegex = /^[A-Z0-9\/-]+$/;
    const upperMatric = matricNumber.toUpperCase();
    if (!matricRegex.test(upperMatric)) {
      res.status(400).json({ error: "Validation", message: "Invalid matric number format" });
      return;
    }

    // Validate level
    const validLevels = [100, 200, 300, 400, 500, 600];
    if (!validLevels.includes(Number(level))) {
      res.status(400).json({ error: "Validation", message: "Level must be 100-600" });
      return;
    }

    // Check for duplicate email
    const existingEmail = await db.select().from(studentsTable).where(eq(studentsTable.schoolEmail, schoolEmail)).limit(1);
    if (existingEmail.length > 0) {
      res.status(400).json({ error: "Validation", message: "Email already registered" });
      return;
    }

    // Check for duplicate matric
    const existingMatric = await db.select().from(studentsTable).where(eq(studentsTable.matricNumber, upperMatric)).limit(1);
    if (existingMatric.length > 0) {
      res.status(400).json({ error: "Validation", message: "Matric number already registered" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const [student] = await db.insert(studentsTable).values({
      fullName,
      schoolEmail,
      password: hashedPassword,
      matricNumber: upperMatric,
      level: Number(level),
    }).returning();

    const token = signToken({ id: student.id, role: "student", name: student.fullName, email: student.schoolEmail });

    await logAction("student_registered", `Student ${student.fullName} registered`, student.id, "student", req);

    res.status(201).json({
      token,
      user: { id: student.id, role: "student", name: student.fullName, email: student.schoolEmail },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal", message: "Registration failed" });
  }
});

// POST /auth/student/login
router.post("/student/login", async (req, res) => {
  try {
    const { matricNumber, password } = req.body;

    if (!matricNumber || !password) {
      res.status(400).json({ error: "Validation", message: "Matric number and password are required" });
      return;
    }

    const upperMatric = matricNumber.toUpperCase();
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.matricNumber, upperMatric)).limit(1);

    if (!student) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: student.id, role: "student", name: student.fullName, email: student.schoolEmail });

    await logAction("student_login", `Student ${student.fullName} logged in`, student.id, "student", req);

    res.json({
      token,
      user: { id: student.id, role: "student", name: student.fullName, email: student.schoolEmail },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal", message: "Login failed" });
  }
});

// POST /auth/admin/login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Validation", message: "Email and password are required" });
      return;
    }

    // Check env-based admins first
    const sysAdminEmail = process.env["SYSTEM_ADMIN_EMAIL"];
    const sysAdminPassword = process.env["SYSTEM_ADMIN_PASSWORD"];
    const electionAdminEmail = process.env["ELECTION_ADMIN_EMAIL"];
    const electionAdminPassword = process.env["ELECTION_ADMIN_PASSWORD"];

    let adminUser: { id: number; role: "election_admin" | "system_admin"; name: string; email: string } | null = null;

    if (email === sysAdminEmail) {
      // Verify system admin password
      const [dbAdmin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
      if (dbAdmin) {
        const valid = await bcrypt.compare(password, dbAdmin.password);
        if (valid) {
          adminUser = { id: dbAdmin.id, role: "system_admin", name: dbAdmin.fullName, email: dbAdmin.email };
        }
      }
    } else if (email === electionAdminEmail) {
      const [dbAdmin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
      if (dbAdmin) {
        const valid = await bcrypt.compare(password, dbAdmin.password);
        if (valid) {
          adminUser = { id: dbAdmin.id, role: "election_admin", name: dbAdmin.fullName, email: dbAdmin.email };
        }
      }
    } else {
      // Try DB admins
      const [dbAdmin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
      if (dbAdmin) {
        const valid = await bcrypt.compare(password, dbAdmin.password);
        if (valid) {
          adminUser = { id: dbAdmin.id, role: dbAdmin.role as "election_admin" | "system_admin", name: dbAdmin.fullName, email: dbAdmin.email };
        }
      }
    }

    if (!adminUser) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: adminUser.id, role: adminUser.role, name: adminUser.name, email: adminUser.email });

    await logAction("admin_login", `Admin ${adminUser.name} logged in`, adminUser.id, adminUser.role, req);

    res.json({
      token,
      user: { id: adminUser.id, role: adminUser.role, name: adminUser.name, email: adminUser.email },
    });
  } catch (err) {
    req.log.error({ err }, "Admin login error");
    res.status(500).json({ error: "Internal", message: "Login failed" });
  }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    if (user.role === "student") {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, user.id)).limit(1);
      if (!student) {
        res.status(404).json({ error: "Not Found", message: "User not found" });
        return;
      }
      res.json({ id: student.id, role: "student", name: student.fullName, email: student.schoolEmail, matricNumber: student.matricNumber, level: student.level });
    } else {
      const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, user.id)).limit(1);
      if (!admin) {
        res.status(404).json({ error: "Not Found", message: "User not found" });
        return;
      }
      res.json({ id: admin.id, role: admin.role, name: admin.fullName, email: admin.email });
    }
  } catch (err) {
    req.log.error({ err }, "GetMe error");
    res.status(500).json({ error: "Internal", message: "Failed to get user" });
  }
});

export default router;
