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
const PORT = process.env.PORT || 3001;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "voting_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
      .json({ status: "healthy", service: "results", database: "connected" });
  } catch (err) {
    logger.error("Health check failed", { error: err.message });
    res
      .status(503)
      .json({
        status: "unhealthy",
        service: "results",
        database: "disconnected",
      });
  }
});

// Homepage with results
app.get("/", async (req, res) => {
  try {
    logger.debug("Results page accessed");

    const result = await pool.query(`
      SELECT option, COUNT(*) as count 
      FROM votes 
      GROUP BY option 
      ORDER BY count DESC
    `);

    const totalResult = await pool.query("SELECT COUNT(*) as total FROM votes");
    const total = parseInt(totalResult.rows[0].total);

    const votes = result.rows.reduce((acc, row) => {
      acc[row.option] = parseInt(row.count);
      return acc;
    }, {});

    const maxVotes = Math.max(...Object.values(votes), 1);

    logger.info("Results retrieved", { total, votes });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Voting Results</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
          }
          .total {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.2em;
          }
          .results {
            margin-bottom: 30px;
          }
          .result-item {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
            transition: transform 0.3s ease;
          }
          .result-item:hover {
            transform: translateX(5px);
          }
          .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .option-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
            text-transform: capitalize;
          }
          .vote-count {
            font-size: 1.8em;
            font-weight: bold;
            color: #667eea;
          }
          .bar-container {
            width: 100%;
            height: 40px;
            background: #e9ecef;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
          }
          .bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 15px;
          }
          .percentage {
            color: white;
            font-weight: bold;
            font-size: 1.1em;
          }
          .actions {
            display: flex;
            gap: 15px;
            margin-top: 30px;
          }
          button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .refresh-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .refresh-btn:hover {
            transform: scale(1.02);
          }
          .delete-btn {
            background: #dc3545;
            color: white;
          }
          .delete-btn:hover {
            background: #c82333;
            transform: scale(1.02);
          }
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
          }
          .empty-state-icon {
            font-size: 4em;
            margin-bottom: 20px;
          }
          .empty-state-text {
            font-size: 1.3em;
          }
          .success-message {
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
          <h1>Voting Results</h1>
          <div class="total">Total votes: <strong>${total}</strong></div>
          
          ${
            req.query.deleted
              ? '<div class="success-message">All votes deleted successfully</div>'
              : ""
          }
          
          <div class="results">
            ${
              total === 0
                ? `
              <div class="empty-state">
                <div class="empty-state-icon">-</div>
                <div class="empty-state-text">No votes registered yet</div>
              </div>
            `
                : Object.entries(votes)
                    .map(([option, count]) => {
                      const percentage =
                        total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                      const barWidth = total > 0 ? (count / maxVotes) * 100 : 0;
                      return `
                <div class="result-item">
                  <div class="result-header">
                    <div class="option-name">${option}</div>
                    <div class="vote-count">${count} ${
                        count === 1 ? "vote" : "votes"
                      }</div>
                  </div>
                  <div class="bar-container">
                    <div class="bar" style="width: ${barWidth}%">
                      <span class="percentage">${percentage}%</span>
                    </div>
                  </div>
                </div>
              `;
                    })
                    .join("")
            }
          </div>
          
          <div class="actions">
            <button class="refresh-btn" onclick="location.reload()">Refresh</button>
            <button class="delete-btn" onclick="if(confirm('Are you sure you want to delete all votes?')) { document.getElementById('deleteForm').submit(); }">
              Delete All
            </button>
          </div>
          
          <form id="deleteForm" method="POST" action="/delete-all" style="display: none;"></form>
        </div>
        
        <script>
          // Auto-refresh every 5 seconds
          setTimeout(() => location.reload(), 5000);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error("Error retrieving results", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).send("Error retrieving results");
  }
});

// Endpoint to delete all votes
app.post("/delete-all", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM votes");
    logger.info("All votes deleted", { rowCount: result.rowCount });
    res.redirect("/?deleted=1");
  } catch (err) {
    logger.error("Error deleting votes", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).send("Error deleting votes");
  }
});

// API endpoint to get results in JSON format
app.get("/api/results", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT option, COUNT(*) as count 
      FROM votes 
      GROUP BY option 
      ORDER BY count DESC
    `);

    const totalResult = await pool.query("SELECT COUNT(*) as total FROM votes");
    const total = parseInt(totalResult.rows[0].total);

    logger.debug("API results retrieved", { total });

    res.json({
      total,
      results: result.rows.map((row) => ({
        option: row.option,
        count: parseInt(row.count),
        percentage:
          total > 0 ? ((parseInt(row.count) / total) * 100).toFixed(2) : 0,
      })),
    });
  } catch (err) {
    logger.error("Error retrieving API results", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Error retrieving results" });
  }
});

// Legacy health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "results" });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Results service running on port ${PORT}`, {
    port: PORT,
    logLevel: process.env.LOG_LEVEL || "info",
  });
});
