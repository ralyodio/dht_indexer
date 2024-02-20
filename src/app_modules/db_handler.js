import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();
import configs from '../configs_router/configs.js';
import memoryHandler from './memory_handler.js';

const { checkIfDbDirExits } = memoryHandler;
const { databaseDirectory, indentation } = configs;


let db;
const openConnection = (dbName) => {
    const pathToDb = `${checkIfDbDirExits(databaseDirectory)}/${dbName}.db`;

    return new Promise((resolve, reject) => {
        db = new Database(pathToDb, async (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                console.log(
                    `${indentation(4)}---> Starting a database...\n` +
                    '------------------------------------------------\n'
                );

                try {
                    await _createTable('torrents', `
                        info_hash TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        seeders INTEGER NOT NULL,
                        leechers INTEGER NOT NULL
                    `);

                    await _createTable('files_info', `
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        torrent_info_hash TEXT,
                        name TEXT NOT NULL,
                        size INTEGER NOT NULL,
                        FOREIGN KEY(torrent_info_hash) REFERENCES torrents(info_hash)
                    `);

                    await _createTable('processed_hashes', `
                        info_hash TEXT PRIMARY KEY
                    `);

                    resolve();
                } catch (err) {
                    reject(err);
                }
            }
        });
    });

}


const _createTable = (tableName, fields) => {
    return new Promise((resolve, reject) => {
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`;

        db.run(sql, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                console.log(`//// Table "${tableName}" checked/created successfully.`);
                resolve();
            }
        });
    });
}


const addProcessedHash = async (infoHash) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT OR IGNORE INTO processed_hashes (info_hash) 
            VALUES (?)
        `;

        db.run(sql, infoHash, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


const checkProcessedHash = async (infoHash) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT info_hash FROM processed_hashes WHERE info_hash = ?
        `;

        db.get(sql, infoHash, (err, row) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(row ? true : false);
            }
        });
    });
}


const insertTorrent = (infoHash, name, seeders, leechers) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT OR REPLACE INTO torrents (info_hash, name, seeders, leechers)
            VALUES (?, ?, ?, ?)
        `;

        db.run(sql, [infoHash, name, seeders, leechers], (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


const insertFilesInfo = (torrentInfoHash, name, size) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO files_info (torrent_info_hash, name, size)
            VALUES (?, ?, ?)
        `;

        db.run(sql, [torrentInfoHash, name, size], (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


const insertFilesBulkInfo = (filesDetails) => {
    return new Promise((resolve, reject) => {
        const placeholders = filesDetails.map(() => '(?, ?, ?)').join(',');
        const parameters = filesDetails.reduce(
            (params, file) => params.concat([file.infoHash, file.name, file.size]), []
        );
        const sql = `INSERT INTO files_info (torrent_info_hash, name, size) VALUES ${placeholders}`;

        db.run(sql, parameters, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


const closeConnection = () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('\n>>> Closing database connection <<<\n');
    });
}


export default {
    openConnection,
    closeConnection,
    insertTorrent,
    insertFilesInfo,
    insertFilesBulkInfo,
    addProcessedHash,
    checkProcessedHash,
};
