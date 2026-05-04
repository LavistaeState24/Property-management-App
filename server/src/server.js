import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env, getMissingCloudinaryEnvVars } from "./config/env.js";
import { ensureSystemRoles } from "./services/permissionService.js";

const bootstrap = async () => {
  try {
    const missingCloudinaryEnvVars = getMissingCloudinaryEnvVars();

    if (missingCloudinaryEnvVars.length) {
      console.warn(
        `Cloudinary config incomplete. Missing: ${missingCloudinaryEnvVars.join(", ")}`
      );
    }

    await connectDatabase();
    await ensureSystemRoles();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

bootstrap();
