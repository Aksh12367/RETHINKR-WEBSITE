<?php
require_once __DIR__ . '/../config/db.php';
$currentUser = $_SESSION['user'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' | ReThinkr' : 'ReThinkr - Don't dump it. Reimagine it.'; ?></title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Custom Stylesheet -->
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <!-- Navigation Bar -->
  <nav class="navbar navbar-expand-lg navbar-rethinkr">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2 text-decoration-none" href="index.php">
        <div class="brand-badge"><i class="bi bi-recycle"></i></div>
        <div>
          <span class="brand-title">ReThinkr</span>
          <span class="brand-tagline">Don't dump it. Reimagine it.</span>
        </div>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarMain">
        <!-- Center Autocomplete Search Bar -->
        <div class="mx-auto my-2 my-lg-0 position-relative" style="max-width: 380px; width: 100%;">
          <form action="search.php" method="GET">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" name="q" id="global-search-input" class="form-control bg-light border-start-0" placeholder="Search jar, shirt, cable, box..." autocomplete="off">
            </div>
          </form>
          <div id="global-search-dropdown" class="autocomplete-dropdown"></div>
        </div>

        <ul class="navbar-nav ms-auto align-items-lg-center gap-1">
          <li class="nav-item">
            <a class="nav-link <?php echo ($activeNav ?? '') === 'home' ? 'active' : ''; ?>" href="index.php">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo ($activeNav ?? '') === 'explore' ? 'active' : ''; ?>" href="search.php">Explore Ideas</a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php echo ($activeNav ?? '') === 'submit' ? 'active' : ''; ?>" href="submit.php">
              <i class="bi bi-plus-circle-fill text-success me-1"></i>Submit Idea
            </a>
          </li>
          <li class="nav-item ms-lg-2 mt-2 mt-lg-0" id="nav-user-area">
            <?php if ($currentUser): ?>
              <div class="dropdown">
                <button class="btn btn-outline-success dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                  <i class="bi <?php echo $currentUser['role'] === 'admin' ? 'bi-shield-check text-warning' : 'bi-person-circle'; ?>"></i>
                  <span class="fw-semibold"><?php echo htmlspecialchars($currentUser['name']); ?></span>
                  <?php if ($currentUser['role'] === 'admin'): ?>
                    <span class="badge bg-warning text-dark ms-1">Admin</span>
                  <?php endif; ?>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                  <li><h6 class="dropdown-header">Signed in as <b><?php echo htmlspecialchars($currentUser['email']); ?></b></h6></li>
                  <li><a class="dropdown-item" href="profile.php"><i class="bi bi-person me-2"></i>My Profile & Submissions</a></li>
                  <li><a class="dropdown-item" href="submit.php"><i class="bi bi-plus-circle me-2"></i>Submit an Idea</a></li>
                  <?php if ($currentUser['role'] === 'admin'): ?>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item fw-bold text-primary" href="admin/index.php"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>
                  <?php endif; ?>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="logout.php"><i class="bi bi-box-arrow-right me-2"></i>Log Out</a></li>
                </ul>
              </div>
            <?php else: ?>
              <div class="d-flex align-items-center gap-2">
                <a href="login.php" class="btn btn-outline-secondary btn-sm px-3 fw-semibold">Log In</a>
                <a href="login.php?tab=register" class="btn btn-primary btn-sm px-3 fw-semibold text-white">Join Free</a>
              </div>
            <?php endif; ?>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <main>
