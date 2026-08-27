import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'quick_tool_db'

// Global connection pool
let pool: mysql.Pool | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    })
  }
  return pool
}

// Initial 19 tools seed data
const DEFAULT_TOOLS = [
  // PDF Category
  { slug: 'compress-pdf', name: 'Compress PDF', category: 'PDF Tools', desc: 'Reduce file size while optimizing for quality.' },
  { slug: 'pdf-to-word', name: 'PDF to Word', category: 'PDF Tools', desc: 'Convert PDF files to editable Word documents.' },
  { slug: 'merge-pdf', name: 'Merge PDF', category: 'PDF Tools', desc: 'Combine multiple PDFs into a single file.' },
  { slug: 'split-pdf', name: 'Split PDF', category: 'PDF Tools', desc: 'Extract pages or split into separate files.' },
  { slug: 'pdf-to-text', name: 'OCR PDF', category: 'PDF Tools', desc: 'Extract all text from scanned PDFs instantly.' },
  
  // Image Category
  { slug: 'image-compressor', name: 'Image Compressor', category: 'Image Tools', desc: 'Compress PNG, JPG, and SVG without losing quality.' },
  { slug: 'resize-image', name: 'Resize Image', category: 'Image Tools', desc: 'Change image dimensions in pixels or percentage.' },
  { slug: 'background-remover', name: 'Background Remover', category: 'Image Tools', desc: 'AI-powered background removal for photos.' },
  { slug: 'image-converter', name: 'Image Converter', category: 'Image Tools', desc: 'Convert images between JPG, PNG, WEBP, GIF, and BMP.' },
  { slug: 'merge-images', name: 'Merge Images', category: 'Image Tools', desc: 'Combine multiple images vertically or horizontally.' },
  { slug: 'image-to-text', name: 'Image to Text', category: 'Image Tools', desc: 'Extract printed and handwritten text using AI OCR.' },
  { slug: 'image-to-pdf', name: 'Image to PDF', category: 'Image Tools', desc: 'Convert images into a single high-quality PDF.' },
  
  // Text Category
  { slug: 'word-counter', name: 'Word Counter', category: 'Text Tools', desc: 'Count words, characters, and reading time.' },
  { slug: 'case-converter', name: 'Case Converter', category: 'Text Tools', desc: 'Toggle between uppercase, lowercase, and title case.' },
  { slug: 'remove-line-breaks', name: 'Remove Line Breaks', category: 'Text Tools', desc: 'Clean up text by removing extra spacing and breaks.' },
  { slug: 'bulk-ocr', name: 'Bulk OCR', category: 'Text Tools', desc: 'Upload up to 50 images and extract text in one batch.' },
  
  // Converter Category
  { slug: 'json-to-csv', name: 'JSON to CSV/Excel', category: 'Converters', desc: 'Convert structured data for spreadsheet software.' },
  { slug: 'unit-converter', name: 'Unit Converter', category: 'Converters', desc: 'Length, weight, area, and volume conversions.' },
  { slug: 'currency-converter', name: 'Currency Converter', category: 'Converters', desc: 'Real-time exchange rates for global currencies.' },
  { slug: 'qr-code-generator', name: 'QR Code Generator', category: 'Converters', desc: 'Create custom QR codes for links, text, or WiFi.' },
]

/**
 * Initializes the MySQL database `quick_tool_db` and builds all necessary tables if missing.
 */
export async function initDb() {
  try {
    // 1. Connect root connection to create database if not present
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    })

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await rootConnection.end()

    // 2. Connect pool with DB_NAME selected
    const db = getDbPool()

    // Users Table (user_type: 0 = Admin, 1 = Regular User)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        user_type TINYINT DEFAULT 1 COMMENT '0: Admin, 1: Regular User',
        role ENUM('admin', 'user') DEFAULT 'user',
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        remember_token VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_user_type (user_type),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Ensure user_type, role, and status columns exist if table was created previously without them
    try {
      await db.query(`ALTER TABLE users ADD COLUMN user_type TINYINT DEFAULT 1 COMMENT '0: Admin, 1: Regular User';`)
    } catch {}
    try {
      await db.query(`ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user';`)
    } catch {}
    try {
      await db.query(`ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'banned') DEFAULT 'active';`)
    } catch {}

    // Password Resets Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_token (email, token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Sessions Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_token (session_token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Tools Configuration Table (Active / Inactive Toggle Control)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tools_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Tool Usages / Analytics Log Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tool_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        tool_slug VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_slug (tool_slug),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Seed default tools into tools_config if empty
    for (const tool of DEFAULT_TOOLS) {
      await db.query(
        `INSERT IGNORE INTO tools_config (slug, name, category, description, is_active) VALUES (?, ?, ?, ?, 1)`,
        [tool.slug, tool.name, tool.category, tool.desc]
      )
    }

    // Auto-create/seed Default Admin User (user_type = 0, role = 'admin')
    const adminEmail = 'admin@quicktools.com'
    const adminHash = '$2b$10$HIuoMBZ22zL0rDPYmL4X8uuu5atnR/T.63bncBJYw0Fzwrq55eJeq' // admin123456

    await db.query(
      `INSERT INTO users (full_name, email, password_hash, user_type, role, status)
       VALUES ('System Administrator', ?, ?, 0, 'admin', 'active')
       ON DUPLICATE KEY UPDATE password_hash = ?, user_type = 0, role = 'admin', status = 'active'`,
      [adminEmail, adminHash, adminHash]
    )

    console.info(`[MySQL] Database "${DB_NAME}" initialized successfully with user_type schemas (0: Admin, 1: User).`)
    return true
  } catch (err) {
    console.error('[MySQL Error] Failed to initialize database:', err)
    return false
  }
}
