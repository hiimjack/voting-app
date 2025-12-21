import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

const { Pool } = pg;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "voting_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Voting options from environment variables
const OPTION_A = process.env.OPTION_A || "cats";
const OPTION_B = process.env.OPTION_B || "dogs";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database migration
async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        option VARCHAR(255) NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info("Database migration completed: votes table created");
  } catch (err) {
    logger.error("Error during database migration", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    client.release();
  }
}

// Health check endpoint
app.get("/healthz", async (req, res) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    logger.debug("Health check passed");
    res
      .status(200)
      .json({ status: "healthy", service: "vote", database: "connected" });
  } catch (err) {
    logger.error("Health check failed", { error: err.message });
    res
      .status(503)
      .json({ status: "unhealthy", service: "vote", database: "disconnected" });
  }
});

// Homepage with voting form
app.get("/", (req, res) => {
  logger.debug("Vote page accessed");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Voting System</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 2em;
        }
        .options {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .option {
          flex: 1;
          background: #f8f9fa;
          border: 3px solid #e9ecef;
          border-radius: 15px;
          padding: 30px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }
        .option:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border-color: #667eea;
        }
        .option input[type="radio"] {
          display: none;
        }
        .option input[type="radio"]:checked + label {
          color: #667eea;
          font-weight: bold;
        }
        .option input[type="radio"]:checked ~ .checkmark {
          background: #667eea;
          border-color: #667eea;
        }
        .option label {
          font-size: 1.5em;
          cursor: pointer;
          display: block;
          margin-bottom: 15px;
          color: #495057;
          transition: color 0.3s ease;
        }
        .checkmark {
          width: 30px;
          height: 30px;
          border: 3px solid #dee2e6;
          border-radius: 50%;
          margin: 0 auto;
          transition: all 0.3s ease;
        }
        button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.2em;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        button:hover {
          transform: scale(1.02);
        }
        button:active {
          transform: scale(0.98);
        }
        .success {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Vote Now</h1>
        ${
          req.query.success
            ? '<div class="success">Vote registered successfully</div>'
            : ""
        }
        <form method="POST" action="/vote">
          <div class="options">
            <div class="option">
              <input type="radio" id="option_a" name="option" value="${OPTION_A}" required>
              <label for="option_a">${
                OPTION_A.charAt(0).toUpperCase() + OPTION_A.slice(1)
              }</label>
              <div class="checkmark"></div>
            </div>
            <div class="option">
              <input type="radio" id="option_b" name="option" value="${OPTION_B}" required>
              <label for="option_b">${
                OPTION_B.charAt(0).toUpperCase() + OPTION_B.slice(1)
              }</label>
              <div class="checkmark"></div>
            </div>
          </div>
          <button type="submit">Submit Vote</button>
        </form>
      </div>
      <script>
        document.querySelectorAll('.option').forEach(option => {
          option.addEventListener('click', () => {
            option.querySelector('input[type="radio"]').checked = true;
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Endpoint to register a vote
app.post("/vote", async (req, res) => {
  const { option } = req.body;

  if (!option || (option !== OPTION_A && option !== OPTION_B)) {
    logger.warn("Invalid vote option received", { option });
    return res.status(400).send("Invalid option");
  }

  try {
    await pool.query("INSERT INTO votes (option) VALUES ($1)", [option]);
    logger.info("Vote registered", { option });
    res.redirect("/?success=1");
  } catch (err) {
    logger.error("Error saving vote", { error: err.message, stack: err.stack });
    res.status(500).send("Error saving vote");
  }
});

// Legacy health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "vote" });
});

// Start server
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Vote service running on port ${PORT}`, {
        port: PORT,
        optionA: OPTION_A,
        optionB: OPTION_B,
        logLevel: process.env.LOG_LEVEL || "info",
      });
    });
  } catch (err) {
    logger.error("Failed to start server", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

start();
