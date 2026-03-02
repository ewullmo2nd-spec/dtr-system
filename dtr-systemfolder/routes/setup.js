const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");
require("dotenv").config();

const router = express.Router();

router.post("/init", async (req, res) => {
    try {
        // Create users table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(100),
                password VARCHAR(255) NOT NULL,
                department VARCHAR(100),
                position VARCHAR(100),
                role ENUM('admin','employee') DEFAULT 'employee',
                status ENUM('active','inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create attendance table
        await db.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                time_in DATETIME,
                lunch_out DATETIME,
                lunch_in DATETIME,
                time_out DATETIME,
                total_hours DECIMAL(5,2),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, date)
            )
        `);

        // Check if admin exists
        const [existing] = await db.query("SELECT id FROM users WHERE employee_id = 'admin'");
        
        if (existing.length === 0) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            
            await db.query(
                "INSERT INTO users (employee_id, full_name, password, role, status) VALUES (?, ?, ?, ?, ?)",
                ["admin", "Administrator", hashedPassword, "admin", "active"]
            );
            
            res.json({ message: "Tables created and admin user created! Login with: admin / admin123" });
        } else {
            res.json({ message: "Tables already exist! Login with: admin / admin123" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error: " + err.message });
    }
});

module.exports = router;
