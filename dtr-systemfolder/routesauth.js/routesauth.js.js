const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const router = express.Router();

router.post("/register", async (req, res) => {
    const { employee_id, full_name, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    try {
        await db.query(
            "INSERT INTO users (employee_id, full_name, password, role) VALUES (?, ?, ?, ?)",
            [employee_id, full_name, hashed, role || "employee"]
        );
        res.json({ message: "User created" });
    } catch (err) {
        res.status(400).json({ message: "Employee ID already exists" });
    }
});

router.post("/login", async (req, res) => {
    const { employee_id, password } = req.body;

    const [rows] = await db.query(
        "SELECT * FROM users WHERE employee_id = ? AND status = 'active'",
        [employee_id]
    );

    if (rows.length === 0)
        return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    res.json({ token });
});

module.exports = router;