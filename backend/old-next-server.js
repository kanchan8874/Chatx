const { createServer } = require("http");
const next = require("next");
const { initSocketServer } = require("./socket/server");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function start() {
  try {
    await app.prepare();

    const server = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (error) {
        console.error("Error while handling request", error);
        res.statusCode = 500;
        res.end("Internal server error");
      }
    });

    initSocketServer(server);

    server.listen(port, () => {
      console.log(`🚀 ChatX ready at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

start();

