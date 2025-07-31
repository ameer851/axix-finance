import express, { Router, Request, Response } from "express";
import { DatabaseStorage } from "./storage";

const storage = new DatabaseStorage();

export function createAdminRouter(): Router {
  const router = Router();

  // Simple auth middleware
  router.use((req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if ((req.user as any).role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });

  // Deposit approval endpoint
  router.post("/deposits/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const tx = await storage.getTransaction(id);
      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (tx.type !== "deposit") {
        return res.status(400).json({ error: "Not a deposit transaction" });
      }

      if (tx.status === "completed") {
        return res.json({ message: "Already approved" });
      }

      const updated = await storage.updateTransactionStatus(id, "completed");
      return res.json({ 
        success: true,
        message: "Deposit approved",
        data: updated
      });
    } catch (error) {
      console.error("Error approving deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export function setupAdminPanel(app: express.Express): void {
  const adminRouter = createAdminRouter();
  app.use("/api/admin", adminRouter);
  console.log("Admin panel routes configured");
}
