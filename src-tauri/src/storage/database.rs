use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaptureRecord {
    pub id: String,
    pub filename: String,
    pub filepath: String,
    pub capture_type: String,
    pub width: i64,
    pub height: i64,
    pub file_size: i64,
    pub created_at: String,
    pub tags: String,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn init(app_data_dir: &PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;

        let db_path = app_data_dir.join("opensnag.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS captures (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                capture_type TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                file_size INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT ''
            )",
            [],
        )
        .map_err(|e| format!("Failed to create table: {}", e))?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn insert_capture(&self, record: &CaptureRecord) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        conn.execute(
            "INSERT INTO captures (id, filename, filepath, capture_type, width, height, file_size, created_at, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                record.id,
                record.filename,
                record.filepath,
                record.capture_type,
                record.width,
                record.height,
                record.file_size,
                record.created_at,
                record.tags,
            ],
        )
        .map_err(|e| format!("Failed to insert capture: {}", e))?;
        Ok(())
    }

    pub fn get_captures(&self) -> Result<Vec<CaptureRecord>, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = conn
            .prepare("SELECT id, filename, filepath, capture_type, width, height, file_size, created_at, tags FROM captures ORDER BY created_at DESC")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let records = stmt
            .query_map([], |row| {
                Ok(CaptureRecord {
                    id: row.get(0)?,
                    filename: row.get(1)?,
                    filepath: row.get(2)?,
                    capture_type: row.get(3)?,
                    width: row.get(4)?,
                    height: row.get(5)?,
                    file_size: row.get(6)?,
                    created_at: row.get(7)?,
                    tags: row.get(8)?,
                })
            })
            .map_err(|e| format!("Failed to query captures: {}", e))?;

        let mut result = Vec::new();
        for record in records {
            result.push(record.map_err(|e| format!("Failed to read row: {}", e))?);
        }
        Ok(result)
    }

    pub fn delete_capture(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        conn.execute("DELETE FROM captures WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete capture: {}", e))?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn search_captures(&self, query: &str) -> Result<Vec<CaptureRecord>, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let search_pattern = format!("%{}%", query);
        let mut stmt = conn
            .prepare(
                "SELECT id, filename, filepath, capture_type, width, height, file_size, created_at, tags
                 FROM captures
                 WHERE filename LIKE ?1 OR tags LIKE ?1 OR capture_type LIKE ?1
                 ORDER BY created_at DESC",
            )
            .map_err(|e| format!("Failed to prepare search query: {}", e))?;

        let records = stmt
            .query_map(params![search_pattern], |row| {
                Ok(CaptureRecord {
                    id: row.get(0)?,
                    filename: row.get(1)?,
                    filepath: row.get(2)?,
                    capture_type: row.get(3)?,
                    width: row.get(4)?,
                    height: row.get(5)?,
                    file_size: row.get(6)?,
                    created_at: row.get(7)?,
                    tags: row.get(8)?,
                })
            })
            .map_err(|e| format!("Failed to search captures: {}", e))?;

        let mut result = Vec::new();
        for record in records {
            result.push(record.map_err(|e| format!("Failed to read row: {}", e))?);
        }
        Ok(result)
    }
}
