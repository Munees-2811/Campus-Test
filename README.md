# CampusTest - Full-Stack Application (React + Vite + Express + Supabase PostgreSQL)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-black?logo=jsonwebtokens)](https://jwt.io/)

A modern, scalable Campus Assessment and Testing Platform built with **React**, **Vite**, **Express.js**, and **Supabase (PostgreSQL)**, featuring **Tailwind CSS**, **JWT Authentication**, and **Role-Based Access Control (Admin & Student)**.

---

## 🌟 Features

- **JWT Authentication & Authorization**: Secure JWT-based authentication with bcrypt password hashing. Strict role enforcement for **Admin** and **Student** roles.
- **Admin Control Center**:
  - Create assessments with multiple-choice questions (MCQs), dynamic options, answer keys, time limits, and publish status.
  - View all student submissions, scores, passing rates, and class analytics.
  - Update or delete assessments and inspect question-level responses.
- **Student Portal**:
  - Live Assessment Catalog: View all active published assessments.
  - Interactive Timed Test Room: Real-time countdown timer, question palette navigation, instant answer selection, and auto-submit upon timer expiration.
  - Instant Scorecard & Performance Metrics: Immediate score computation with percentage and pass/fail evaluation.
- **Supabase PostgreSQL as Database**: High-performance relational database with structured tables for profiles, tests, results, activity logs, and notifications.
- **Server-Side Answer Validation**: Correct answers are kept strictly server-side and are **never** exposed to students or sent to the frontend during test taking.
- **Row Level Security (RLS)**: Comprehensive RLS policies defined on Supabase for defense in depth.
- **Modern UI/UX**: Styled with Tailwind CSS, fully responsive layouts, reusable component library (cards, modals, loaders, badges, inputs, buttons).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express.js 5 |
| Database | Supabase (PostgreSQL 15) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Styling | Tailwind CSS |

---

## 🏗️ Project Structure

```
Campus-Test/
├── package.json                         # Root convenience runner scripts
├── .gitignore
├── README.md
│
├── server/                              # Express & Node.js Backend
│   ├── .env                             # Backend environment variables
│   ├── .env.example                     # Backend env template
│   ├── package.json
│   ├── server.js                        # HTTP server entry point
│   └── src/
│       ├── app.js                       # Express app configuration & middleware
│       ├── config/
│       │   ├── supabaseClient.js        # Supabase Admin client with service role key
│       │   └── migrations/              # Supabase PostgreSQL schema migrations
│       │       ├── 001_profiles.sql
│       │       ├── 002_tests.sql
│       │       ├── 003_results.sql
│       │       ├── 004_rls_policies.sql
│       │       ├── 005_notifications.sql
│       │       ├── 006_activity_logs.sql
│       │       └── 007_seed.sql
│       ├── controllers/
│       │   ├── authController.js        # Register, Login, Me endpoints
│       │   ├── testController.js        # Test CRUD, submissions, evaluations
│       │   └── dashboardController.js   # Admin & Student analytics stats
│       ├── middleware/
│       │   ├── authMiddleware.js        # JWT verification & role authorization
│       │   └── errorMiddleware.js       # Centralized error handler & 404 catcher
│       ├── routes/
│       │   ├── authRoutes.js            # /api/auth routes
│       │   ├── testRoutes.js            # /api/tests routes
│       │   └── dashboardRoutes.js       # /api/dashboard routes
│       └── utils/
│           ├── generateToken.js         # JWT generation helper
│           └── seeder.js                # Database seeder script
│
└── client/                              # React + Vite Frontend
    ├── .env                             # Frontend environment variables
    ├── .env.example                     # Frontend env template
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx                     # React DOM entry point
        ├── App.jsx                      # Router & AuthProvider root
        ├── index.css                    # Tailwind CSS directives
        ├── context/
        │   └── AuthContext.jsx          # Global auth state & user session
        ├── components/
        │   └── common/
        │       ├── Badge.jsx            # Status & role badges
        │       ├── Button.jsx           # Reusable button with loading state
        │       ├── Card.jsx             # Card container component
        │       ├── Input.jsx            # Form input with validation display
        │       ├── Loader.jsx           # Loading spinner component
        │       ├── Modal.jsx            # Accessible dialog modal
        │       ├── Navbar.jsx           # Header navbar with user menu
        │       └── ProtectedRoute.jsx   # Role-based route guard
        ├── pages/
        │   ├── Login.jsx                # Sign in page
        │   ├── Register.jsx             # Sign up with Admin/Student role selection
        │   ├── AdminDashboard.jsx       # Admin management & metrics
        │   ├── StudentDashboard.jsx     # Student available tests & history
        │   ├── TakeTest.jsx             # Timed interactive assessment room
        │   ├── Unauthorized.jsx         # 403 Forbidden page
        │   └── NotFound.jsx             # 404 Not Found page
        ├── routes/
        │   └── AppRoutes.jsx            # Route definitions
        └── services/
            ├── api.js                   # Axios client instance with interceptors
            ├── authService.js           # Authentication API calls
            └── testService.js           # Assessments & dashboard API calls
```

---

## ⚡ Supabase Setup

Follow these steps to configure your Supabase PostgreSQL database:

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the Supabase dashboard, open the **SQL Editor** and run each migration file in order:
   - `001_profiles.sql` (Creates user profiles table and enum types)
   - `002_tests.sql` (Creates tests and questions tables)
   - `003_results.sql` (Creates test results and student answers tables)
   - `004_rls_policies.sql` (Enables Row Level Security and access policies)
   - `005_notifications.sql` (Creates notifications system table)
   - `006_activity_logs.sql` (Creates audit and activity logging table)
   - `007_seed.sql` *(Optional: seeds initial database records)*
3. Navigate to **Project Settings** → **API** to retrieve:
   - **Project URL** (`SUPABASE_URL`)
   - **Service Role Secret Key** (`SUPABASE_SERVICE_ROLE_KEY`)
4. Add the URL and key to `server/.env`.

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_secure_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Getting Started

Follow these steps to run the application locally:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Campus-Test
   ```

2. **Create Supabase project and run migrations**:
   Execute the migration SQL scripts in order via Supabase SQL Editor as detailed in [Supabase Setup](#-supabase-setup).

3. **Configure environment variables**:
   Create `server/.env` and `client/.env` using the templates provided above.

4. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

5. **Install frontend dependencies**:
   ```bash
   cd ../client
   npm install
   ```

6. **Seed sample data** *(Optional)*:
   ```bash
   cd ../server
   npm run seed
   ```

7. **Start the backend development server**:
   ```bash
   cd server
   npm run dev
   ```
   *Runs at `http://localhost:5000`.*

8. **Start the frontend development server**:
   ```bash
   cd client
   npm run dev
   ```
   *Runs at `http://localhost:5173`.*

---

## 🔑 Default Seed Credentials

After running `npm run seed`, you can sign in with:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@campus.edu` | `Password123!` |
| **Student** | `student@campus.edu` | `Password123!` |

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (Admin / Student) |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |

### Tests & Assessments (`/api/tests`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tests` | Private | List tests (Admin sees all; Student sees active) |
| `GET` | `/api/tests/:id` | Private | Fetch details for a specific test |
| `POST` | `/api/tests` | Admin | Create assessment with MCQs, options, and answers |
| `PUT` | `/api/tests/:id` | Admin | Update assessment details and questions |
| `DELETE` | `/api/tests/:id` | Admin | Remove assessment and associated submission results |
| `POST` | `/api/tests/:id/submit` | Student | Submit test responses; calculates score & pass status |
| `GET` | `/api/tests/results/my` | Student | List authenticated student's previous submissions |
| `GET` | `/api/tests/:id/results` | Admin | View all student submissions for a specific test |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Private | Fetch role-specific statistics & metrics |

---

## 🔒 Security Notes

- **Service Role Key Isolation**: The `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to the backend server. It is **never** sent to the client browser or exposed via frontend bundles.
- **Decoupled API Architecture**: All database operations are proxied through the Express.js API backend. The client only interacts with the application via `/api/*` REST endpoints.
- **Protected Question Keys**: Question answer keys and correct options are excluded from student test payloads, preventing client-side inspection or tampering.
- **Row Level Security (RLS)**: Enabled across Supabase tables to enforce defense-in-depth security at the PostgreSQL database engine level.
