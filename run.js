const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Express Config
const app = express();
const PORT = 3000;

// Paths
const itemsFilePath = path.join(__dirname, 'config', 'items.json');
const dbFilePath = path.join(__dirname, 'inventory.db');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) return reject(err);

            db.run(`
                CREATE TABLE IF NOT EXISTS Inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL,
                    quantity INTEGER NOT NULL
                )
            `, (err) => {
                if (err) return reject(err);

                db.run(`
                    CREATE TABLE IF NOT EXISTS Settings (
                        id INTEGER PRIMARY KEY,
                        currentColor TEXT NOT NULL
                    )
                `, (err) => {
                    if (err) return reject(err);

                    db.get('SELECT * FROM Settings WHERE id = 1', (err, row) => {
                        if (err) return reject(err);

                        if (!row) {
                            db.run('INSERT INTO Settings (id, currentColor) VALUES (1, ?)', ['Purple'], (err) => {
                                if (err) return reject(err);
                                resolve(db);
                            });
                        } else {
                            resolve(db);
                        }
                    });
                });
            });
        });
    });
};

// Management Page
app.get('/management', async (req, res) => {
    const db = await initializeDatabase();
    db.get('SELECT currentColor FROM Settings WHERE id = 1', [], (err, row) => {
        if (err) return res.status(500).send('Database error');

        const color = row.currentColor;

        db.all('SELECT * FROM Inventory WHERE color = ?', [color], (err, rows) => {
            if (err) return res.status(500).send('Database error');
            res.render('management', { items: rows, currentColor: color });
        });
    });
});

app.post('/management/color', (req, res) => {
    const { color } = req.body;
    const db = new sqlite3.Database(dbFilePath);

    db.run('UPDATE Settings SET currentColor = ? WHERE id = 1', [color], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// User Page
app.get('/user', async (req, res) => {
    const db = await initializeDatabase();
    db.get('SELECT currentColor FROM Settings WHERE id = 1', [], (err, row) => {
        if (err) return res.status(500).send('Database error');

        const color = row.currentColor;
        db.all('SELECT * FROM Inventory WHERE color = ?', [color], (err, rows) => {
            if (err) return res.status(500).send('Database error');
            res.render('user', { items: rows, color });
        });
    });
});

// Inventory System
app.post('/inventory/update', async (req, res) => {
    const { name, action, color } = req.body;
    const db = await initializeDatabase();
    console.log('Request Body:', req.body);

    db.get('SELECT * FROM Inventory WHERE name = ? AND color = ?', [name, color], (err, item) => {
        if (err) {
            console.error('SQL error', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        let newQuantity = action === 'add' ? item.quantity + 1 : item.quantity - 1;

        if (newQuantity < 0) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
        }

        db.run('UPDATE Inventory SET quantity = ? WHERE name = ? AND color = ?', [newQuantity, name, color], (err) => {
            if (err) {
                console.error('SQL error', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            return res.json({ success: true, newQuantity });
        });
    });
});

app.get('/inventory', async (req, res) => {
    const db = await initializeDatabase();
    const color = req.query.color;

    db.all('SELECT * FROM Inventory WHERE color = ?', [color], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });

        res.json({ items: rows });
    });
});

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize the application', err);
});
