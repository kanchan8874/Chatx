import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Fix for monorepo: Set the root directory for file tracing
  // This tells Next.js where the root of the workspace is
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
