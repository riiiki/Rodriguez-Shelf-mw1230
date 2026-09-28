const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "shelf_db"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database: shelf_db");
});

app.get("/api/books", (req, res) => {
    let sql = "SELECT * FROM books WHERE 1=1";
    let params = [];

    if (req.query.status) {
        sql += " AND status = ?";
        params.push(req.query.status);
    }

    if (req.query.q) {
        sql += " AND (title LIKE ? OR author LIKE ? OR genre LIKE ?)";
        const needle = `%${req.query.q}%`;
        params.push(needle, needle, needle);
    }

    sql += " ORDER BY createdAt DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

app.get("/api/books/:id", (req, res) => {
    const sql = "SELECT * FROM books WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Book not found." });
        }
        res.json(results[0]);
    });
});

app.post("/api/books", (req, res) => {
    const { title, author, year, genre, status, rating, notes } = req.body;

    if (!title || !author) {
        return res.status(400).json({ errors: ["Title and Author are required."] });
    }

    const sql = `
        INSERT INTO books (title, author, year, genre, status, rating, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title, 
            author, 
            year || null, 
            genre || '', 
            status || 'want', 
            rating || 0, 
            notes || ''
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            res.status(201).json({
                message: "Book added successfully",
                id: result.insertId
            });
        }
    );
});

app.put("/api/books/:id", (req, res) => {
    const { title, author, year, genre, status, rating, notes } = req.body;
    const id = req.params.id;

    const sql = `
        UPDATE books 
        SET title = ?, author = ?, year = ?, genre = ?, status = ?, rating = ?, notes = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            title, 
            author, 
            year || null, 
            genre || '', 
            status || 'want', 
            rating || 0, 
            notes || '', 
            id
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Book not found." });
            }

            res.json({ message: "Book updated successfully" });
        }
    );
});

app.delete("/api/books/:id", (req, res) => {
    const sql = "DELETE FROM books WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Book not found." });
        }
        res.json({ message: "Book deleted successfully" });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});