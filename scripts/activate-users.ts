import { DatabaseStorage } from "../server/storage";

async function activateAllUsers() {
  const storage = new DatabaseStorage();
  try {
    console.log("Connecting to database...");
    const connected = await storage.checkDatabaseConnection();
    if (!connected) {
      throw new Error("Failed to connect to database");
    }

    console.log("Getting all users...");
    const users = await storage.getAllUsers();
    console.log(`Found ${users.length} users`);

    let activated = 0;
    for (const user of users) {
      if (!user.isActive || !user.isVerified) {
        console.log(`Activating user: ${user.username}`);
        await storage.updateUser(user.id, {
          isActive: true,
          isVerified: true
        });
        activated++;
      }
    }

    console.log(`Activated ${activated} users`);
    console.log("Operation completed successfully");
  } catch (error) {
    console.error("Error activating users:", error);
  }
}

activateAllUsers();
