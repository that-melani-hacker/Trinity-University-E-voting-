/**
 * Seed script: creates admin accounts and sample election data.
 * Run: pnpm --filter @workspace/scripts run seed
 */
import { db } from "@workspace/db";
import {
  adminsTable,
  studentsTable,
  electionsTable,
  positionsTable,
  candidatesTable,
} from "@workspace/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding database...");

  // --- Admin accounts ---
  const sysAdminEmail = process.env["SYSTEM_ADMIN_EMAIL"] ?? "sysadmin@trinityuniversity.edu.ng";
  const sysAdminPassword = process.env["SYSTEM_ADMIN_PASSWORD"] ?? "SysAdmin@123";
  const elAdminEmail = process.env["ELECTION_ADMIN_EMAIL"] ?? "electionadmin@trinityuniversity.edu.ng";
  const elAdminPassword = process.env["ELECTION_ADMIN_PASSWORD"] ?? "ElAdmin@123";

  // Upsert system admin
  const existingSysAdmin = await db.select().from(adminsTable).where(eq(adminsTable.email, sysAdminEmail)).limit(1);
  if (existingSysAdmin.length === 0) {
    await db.insert(adminsTable).values({
      fullName: "System Administrator",
      email: sysAdminEmail,
      password: await bcrypt.hash(sysAdminPassword, 10),
      role: "system_admin",
    });
    console.log("✅ System admin created:", sysAdminEmail);
  } else {
    // Update password hash in case env changed
    await db.update(adminsTable).set({ password: await bcrypt.hash(sysAdminPassword, 10) }).where(eq(adminsTable.email, sysAdminEmail));
    console.log("♻️  System admin already exists, password updated:", sysAdminEmail);
  }

  // Upsert election admin
  const existingElAdmin = await db.select().from(adminsTable).where(eq(adminsTable.email, elAdminEmail)).limit(1);
  if (existingElAdmin.length === 0) {
    await db.insert(adminsTable).values({
      fullName: "Election Administrator",
      email: elAdminEmail,
      password: await bcrypt.hash(elAdminPassword, 10),
      role: "election_admin",
    });
    console.log("✅ Election admin created:", elAdminEmail);
  } else {
    await db.update(adminsTable).set({ password: await bcrypt.hash(elAdminPassword, 10) }).where(eq(adminsTable.email, elAdminEmail));
    console.log("♻️  Election admin already exists, password updated:", elAdminEmail);
  }

  // --- Sample students ---
  const students = [
    { fullName: "Adebayo Okonkwo", schoolEmail: "adebayo.okonkwo@trinityuniversity.edu.ng", matricNumber: "TU/2021/CSC/001", level: 300 },
    { fullName: "Chidinma Eze", schoolEmail: "chidinma.eze@trinityuniversity.edu.ng", matricNumber: "TU/2022/ENG/002", level: 200 },
    { fullName: "Emeka Nwosu", schoolEmail: "emeka.nwosu@trinityuniversity.edu.ng", matricNumber: "TU/2021/MED/003", level: 400 },
    { fullName: "Fatimah Abdullahi", schoolEmail: "fatimah.abdullahi@trinityuniversity.edu.ng", matricNumber: "TU/2023/ACC/004", level: 100 },
    { fullName: "Gbenga Adesanya", schoolEmail: "gbenga.adesanya@trinityuniversity.edu.ng", matricNumber: "TU/2020/LAW/005", level: 500 },
    { fullName: "Halima Musa", schoolEmail: "halima.musa@trinityuniversity.edu.ng", matricNumber: "TU/2020/PHY/006", level: 600 },
    { fullName: "Ikenna Obi", schoolEmail: "ikenna.obi@trinityuniversity.edu.ng", matricNumber: "TU/2022/CHE/007", level: 200 },
    { fullName: "Josephine Okafor", schoolEmail: "josephine.okafor@trinityuniversity.edu.ng", matricNumber: "TU/2021/BIO/008", level: 300 },
    { fullName: "Kelechi Onyeka", schoolEmail: "kelechi.onyeka@trinityuniversity.edu.ng", matricNumber: "TU/2023/ECO/009", level: 100 },
    { fullName: "Lateefah Bello", schoolEmail: "lateefah.bello@trinityuniversity.edu.ng", matricNumber: "TU/2022/PSY/010", level: 200 },
  ];

  for (const student of students) {
    const existing = await db.select().from(studentsTable).where(eq(studentsTable.matricNumber, student.matricNumber)).limit(1);
    if (existing.length === 0) {
      await db.insert(studentsTable).values({
        ...student,
        password: await bcrypt.hash("Student@123", 10),
      });
      console.log("✅ Student created:", student.fullName);
    } else {
      console.log("♻️  Student already exists:", student.fullName);
    }
  }

  // --- Sample Election ---
  const existingElection = await db.select().from(electionsTable).where(eq(electionsTable.title, "2024/2025 Student Union Government Election")).limit(1);
  let electionId: number;

  if (existingElection.length === 0) {
    const [election] = await db.insert(electionsTable).values({
      title: "2024/2025 Student Union Government Election",
      description: "Annual election for the Trinity University Student Union Government positions",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }).returning();
    electionId = election.id;
    console.log("✅ Election created:", election.title);
  } else {
    electionId = existingElection[0]!.id;
    console.log("♻️  Election already exists");
  }

  // --- Positions ---
  const positionData = [
    {
      title: "President",
      description: "Student Union President - leads the student body",
      candidates: [
        { fullName: "Chukwuemeka Adeyemi", biography: "3rd year Computer Science student with 4 years of leadership experience in the science faculty." },
        { fullName: "Ngozi Okonkwo", biography: "4th year Law student and current Vice President of the Law Students Association." },
        { fullName: "Taiwo Babatunde", biography: "3rd year Engineering student passionate about student welfare and campus development." },
      ],
    },
    {
      title: "Vice President",
      description: "Student Union Vice President - assists the President",
      candidates: [
        { fullName: "Aisha Mohammed", biography: "2nd year Medical student and active member of the Medical Students Association." },
        { fullName: "Biodun Alabi", biography: "3rd year Economics student with experience in campus advocacy and student welfare." },
        { fullName: "Chiamaka Obi", biography: "3rd year Biochemistry student and current Secretary-General of the Science Students Association." },
      ],
    },
    {
      title: "General Secretary",
      description: "Manages administrative functions of the Student Union",
      candidates: [
        { fullName: "Damilola Ogundimu", biography: "2nd year Accounting student with strong organizational and communication skills." },
        { fullName: "Emmanuel Uzor", biography: "3rd year Mass Communication student and editor of the student newspaper." },
      ],
    },
  ];

  for (const pos of positionData) {
    let positionId: number;
    const existingPos = await db.select().from(positionsTable)
      .where(eq(positionsTable.title, pos.title))
      .limit(1);

    if (existingPos.length === 0) {
      const [position] = await db.insert(positionsTable).values({
        title: pos.title,
        description: pos.description,
        electionId,
      }).returning();
      positionId = position.id;
      console.log("✅ Position created:", pos.title);
    } else {
      positionId = existingPos[0]!.id;
      console.log("♻️  Position already exists:", pos.title);
    }

    // Candidates
    for (const cand of pos.candidates) {
      const existingCand = await db.select().from(candidatesTable)
        .where(eq(candidatesTable.fullName, cand.fullName))
        .limit(1);

      if (existingCand.length === 0) {
        await db.insert(candidatesTable).values({
          fullName: cand.fullName,
          biography: cand.biography,
          positionId,
        });
        console.log("  ✅ Candidate added:", cand.fullName);
      } else {
        console.log("  ♻️  Candidate already exists:", cand.fullName);
      }
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("Admin logins:");
  console.log("  System Admin:", sysAdminEmail);
  console.log("  Election Admin:", elAdminEmail);
  console.log("Student login (any seeded student):", "TU/2021/CSC/001 / Student@123");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
