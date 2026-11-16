<?php
/**
 * ReThinkr - Database Configuration
 * Connects to MySQL using PDO
 */
define('DB_HOST', 'localhost');
define('DB_NAME', 'rethinkr');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("<div style='font-family: sans-serif; padding: 2rem; background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; margin: 2rem;'>
                <h3 style='color: #991b1b; margin-top: 0;'>Database Connection Error</h3>
                <p>Could not connect to MySQL database <code>rethinkr</code>.</p>
                <p><b>Quick Setup Steps:</b></p>
                <ol>
                    <li>Open XAMPP Control Panel and start <b>Apache</b> and <b>MySQL</b>.</li>
                    <li>Open <code>http://localhost/phpmyadmin</code>.</li>
                    <li>Create database named <code>rethinkr</code>.</li>
                    <li>Import the SQL file located at: <code>data/rethinkr.sql</code>.</li>
                </ol>
                <p><i>Error details: " . htmlspecialchars($e->getMessage()) . "</i></p>
            </div>");
        }
    }
    return $pdo;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
