import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import type { Request } from "express";

// Log an action to the audit log
export async function logAction(
  action: string,
  details?: string,
  userId?: number,
  userRole?: string,
  req?: Request
) {
  try {
    await db.insert(auditLogsTable).values({
      action,
      details,
      userId,
      userRole,
      ipAddress: req?.ip ?? req?.socket?.remoteAddress,
    });
  } catch (err) {
    // Don't let audit logging failures break the main flow
    console.error("Failed to write audit log:", err);
  }
}
