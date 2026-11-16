# ReThinkr: "Don't dump it. Reimagine it."

> **A Web-Based Platform for Discovering Alternative Uses for Everyday Household Objects Before Disposal**

ReThinkr is an item-first circular economy web platform developed based on the project synopsis for summer training. Instead of only pointing users to waste recycling centers, ReThinkr prioritizes **Reuse and Repair**, which sit higher in the waste hierarchy (*Reduce, Reuse, Recycle*), helping households reduce landfill burden and save money.

---

## 🌟 Key Features & Objectives (Synopsis Mapping)

| Synopsis Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **1. Responsive Web Design** | Built with Bootstrap 5, custom eco-palette CSS, fluid grid for mobile and desktop browsers. | ✅ Complete |
| **2. Curated Database (50+ Items, 150+ Ideas)** | **52 Household Items** across 8 waste categories with **156+ step-by-step categorized ideas** (Reuse, Repair, Recycle). | ✅ Complete |
| **3. Multi-Facet Smart Filters** | Instant filtering by Cost (*Free*, *Low*, *Medium*), Difficulty (*Easy*, *Medium*, *Advanced*), Action Type, and Materials at home. | ✅ Complete |
| **4. User Accounts & Management** | Role-based authentication: Visitor (search/browse), Registered User (favorites/submissions), Admin (moderation/analytics). | ✅ Complete |
| **5. Community Ideas Submission** | Registered users can submit new reuse guides with tools, step builder, and image preview (saved as `pending`). | ✅ Complete |
| **6. Admin & Moderation Panel** | Admin dashboard with live stats, 1-click **Approve** (instantly goes live) and **Reject** buttons, category distribution bars. | ✅ Complete |
| **7. Technology Stack** | PHP 8, MySQL 8 / MariaDB, HTML5, CSS3, ES6 JavaScript, Bootstrap 5, Fetch API / AJAX. | ✅ Complete |

---

## 📁 Project Structure

```
summer training/
├── index.html / index.php         # Homepage (Hero, Stats, Category grid, Trending ideas)
├── search.html / search.php       # Explorer with live search, multi-facet smart filters
├── item.html / item.php           # Item detail (Environmental impact, available ideas)
├── idea.html / idea.php           # Step-by-step guide with interactive materials checklist
├── submit.html / submit.php       # Community submission form (Dynamic step/material builder)
├── profile.html / profile.php     # User profile, my submissions status, saved favorites
├── login.html / login.php         # Authentication with 1-click Demo Logins (Admin & Member)
├── admin.html / admin/index.php   # Admin moderation queue and system analytics dashboard
├── data/
│   ├── items_data.json            # Curated JSON dataset (52 items, 156+ ideas, 8 categories)
│   └── rethinkr.sql               # Complete MySQL schema & relational dump for XAMPP
├── assets/
│   ├── css/style.css              # Custom styling, badges, timeline, and card system
│   └── js/app.js                  # Dynamic controller, AJAX search, client-side store
├── config/
│   └── db.php                     # PHP PDO database connection for MySQL
├── includes/
│   ├── header.php                 # Reusable PHP header with responsive navigation
│   └── footer.php                 # Reusable PHP footer with project credentials
├── server.js                      # Instant local development server (Node.js)
├── start.bat                      # One-click Windows launcher
└── README.md                      # Project documentation
```

---

## 🚀 How to Run the Website

You have two convenient ways to run and evaluate ReThinkr:

### Option 1: Instant Local Runner (Recommended for Quick Testing)
No XAMPP configuration required! Uses the installed Node.js runtime:
1. Double-click **`start.bat`** (or open terminal in this folder and run `node server.js`).
2. Your browser will automatically open:
   👉 **`http://localhost:3000`**
3. Browse all 52 items, 156+ ideas, use the search and filters, submit an idea, and log in to the admin dashboard!

### Option 2: Apache & MySQL (XAMPP College Submission Mode)
To run within XAMPP as specified in the synopsis:
1. Start **Apache** and **MySQL** in the **XAMPP Control Panel**.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Create a new database named **`rethinkr`**.
4. Click **Import** and select the file **`data/rethinkr.sql`**, then click **Go**.
5. Copy this entire project folder into your XAMPP `htdocs` directory (e.g. `C:\xampp\htdocs\rethinkr`).
6. Visit `http://localhost/rethinkr/index.php` in your browser.

---

## 👥 Demo User Credentials

For testing role-based access control, the following accounts are pre-configured:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@rethinkr.org` | `admin123` | Full access to Moderation Queue, approve/reject submissions, system stats |
| **Community Member** | `user@rethinkr.org` | `user123` | Submit ideas (saved as pending), save favorites, view submission status |
| **Visitor** | *(No login)* | - | Search, filter, view all approved items and step-by-step guides |

*(Tip: You can also use the **Quick 1-Click Demo Login** buttons on `login.html`!)*

---

## 🎓 Project Synopsis Team & Responsibilities

- **Meghna Jain** (*Enrollment No. 35717702024*): Project Lead, Database Design, SQL relational schema, PHP PDO backend.
- **Aksh Mittal** (*Enrollment No. 35517702024*): Front-End Development, responsive UI, search page, smart multi-facet filters, Bootstrap styling.
- **Bhavya Goyal** (*Enrollment No. 36517702024*): Community ideas submission module, user authentication, session handling, admin moderation panel.
- **Pari Khurana** (*Enrollment No. 52617702024*): Content curation for the 50+ item / 150+ ideas database, UI wireframes, documentation, and testing.
