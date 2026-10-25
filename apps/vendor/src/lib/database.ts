// db.ts
import mysql from "mysql2/promise";

let cached: { pool?: mysql.Pool } = (global as any).mysql;

if (!cached) {
  cached = (global as any).mysql = {};
}

export function connectDB() {
  if (cached.pool) {
    return cached.pool;
  }

  // Create a new connection pool
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB || "my_app_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  cached.pool = pool;
  return pool;
}