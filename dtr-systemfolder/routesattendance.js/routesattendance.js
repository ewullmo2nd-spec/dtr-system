const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.post("/time-in", authenticateToken, async (req, res) => {
    try {
        await db.query(
            "INSERT INTO attendance (user_id, date, time_in) VALUES (?, CURDATE(), NOW())",
            [req.user.id]
        );
        res.json({ message: "Time In recorded" });
    } catch {
        res.status(400).json({ message: "Already timed in today" });
    }
});

router.post("/lunch-out", authenticateToken, async (req, res) => {
    await db.query(
        "UPDATE attendance SET lunch_out = NOW() WHERE user_id = ? AND date = CURDATE()",
        [req.user.id]
    );
    res.json({ message: "Lunch Out recorded" });
});

router.post("/lunch-in", authenticateToken, async (req, res) => {
    await db.query(
        "UPDATE attendance SET lunch_in = NOW() WHERE user_id = ? AND date = CURDATE()",
        [req.user.id]
    );
    res.json({ message: "Lunch In recorded" });
});

router.post("/time-out", authenticateToken, async (req, res) => {
    await db.query(
        `UPDATE attendance 
         SET time_out = NOW(),
         total_hours = (
             TIMESTAMPDIFF(MINUTE, time_in, NOW()) / 60
             - IFNULL(TIMESTAMPDIFF(MINUTE, lunch_out, lunch_in)/60, 0)
         )
         WHERE user_id = ? AND date = CURDATE()`,
        [req.user.id]
    );
    res.json({ message: "Time Out recorded" });
});

router.get("/my-records", authenticateToken, async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC",
        [req.user.id]
    );
    res.json(rows);
});

module.exports = router;
