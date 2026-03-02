const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/all", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin")
        return res.sendStatus(403);

    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
});

module.exports = router;