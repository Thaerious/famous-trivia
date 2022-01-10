import sqlite3 from "sqlite3";
import fs from "fs";
import Path from "path";

/**
 * Create the database file.
 * Deletes any previous file already there.
 */
async function setupDB (dbPath, dbFileName, dbScriptPath) {
    const fullPath = Path.join(dbPath, dbFileName);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }

    fs.mkdirSync(dbPath, { recursive: true });

    // Setup the database connection
    const db = new sqlite3.Database(fullPath.toString(), async (err) => {
        if (err) {
            throw new Error(`Could not connect to database: ${fullPath}`);
        }
    });

    await populateDB(db, dbScriptPath);
    db.close();
}

function populateDB (db, dbScriptPath) {
    return new Promise((resolve, reject) => {
        const sql = fs.readFileSync(dbScriptPath);

        db.exec(sql.toString(), (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

export default setupDB;
