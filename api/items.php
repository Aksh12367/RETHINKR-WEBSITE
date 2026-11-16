<?php
header('Content-Type: application/json');
$dataFile = __DIR__ . '/../data/items_data.json';
if (file_exists($dataFile)) {
    echo file_get_contents($dataFile);
} else {
    echo json_encode(['error' => 'Data file not found']);
}
