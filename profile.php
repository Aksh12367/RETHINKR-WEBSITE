<?php
$pageTitle = "Profile";
$activeNav = "";
require_once __DIR__ . '/includes/header.php';
$html = file_get_contents(__DIR__ . '/profile.html');
if (preg_match('/<main>(.*?)<\/main>/s', $html, $matches)) {
    echo $matches[1];
}
require_once __DIR__ . '/includes/footer.php';
?>