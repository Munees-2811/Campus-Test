\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 007: seed data
--
-- WARNING: This file is for DEVELOPMENT / DEMO purposes only.
-- Do NOT run this in production without replacing the placeholder hashes.
--
-- Password hashes below are intentional PLACEHOLDERS.
-- Replace these hashes with bcrypt-generated values or use the npm run seed command
--
-- To generate bcrypt hashes:
--   node -e "const b=require('bcryptjs'); b.hash('YourPassword1!', 12).then(console.log)"
-- or run:
--   npm run seed
-- from the server/ directory which will handle hashing automatically.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Section 1: Seed users (profiles)
-- ---------------------------------------------------------------------------

-- Replace these hashes with bcrypt-generated values or use the npm run seed command
INSERT INTO profiles (id, name, email, password_hash, role)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Campus Admin',
    'admin@campus.edu',
    '$2a$12$PLACEHOLDER_ADMIN_HASH_REPLACE_ME_WITH_BCRYPT_OUTPUT_____', -- REPLACE
    'admin'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Sample Student',
    'student@campus.edu',
    '$2a$12$PLACEHOLDER_STUDENT_HASH_REPLACE_ME_WITH_BCRYPT_OUTPUT___', -- REPLACE
    'student'
  )
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Section 2: Seed tests
-- ---------------------------------------------------------------------------

INSERT INTO tests (id, title, description, category, duration_minutes, total_marks, pass_marks, questions, created_by, is_active)
VALUES
  (
    'c0000000-0000-0000-0000-000000000003',
    'General Knowledge Quiz',
    'A short quiz covering basic general knowledge topics.',
    'General',
    15,
    20,
    12,
    '[
      {
        "questionText": "What is the capital of France?",
        "options": ["Berlin", "Madrid", "Paris", "Rome"],
        "correctAnswer": 2,
        "marks": 5
      },
      {
        "questionText": "Which planet is known as the Red Planet?",
        "options": ["Earth", "Mars", "Jupiter", "Saturn"],
        "correctAnswer": 1,
        "marks": 5
      },
      {
        "questionText": "What is 7 multiplied by 8?",
        "options": ["54", "56", "58", "64"],
        "correctAnswer": 1,
        "marks": 5
      },
      {
        "questionText": "Who wrote ''Romeo and Juliet''?",
        "options": ["Charles Dickens", "Mark Twain", "William Shakespeare", "Jane Austen"],
        "correctAnswer": 2,
        "marks": 5
      }
    ]'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'Basic Programming Concepts',
    'Test your understanding of fundamental programming concepts.',
    'Programming',
    20,
    30,
    18,
    '[
      {
        "questionText": "What does HTML stand for?",
        "options": [
          "HyperText Markup Language",
          "HighText Machine Language",
          "HyperText and links Markup Language",
          "None of the above"
        ],
        "correctAnswer": 0,
        "marks": 10
      },
      {
        "questionText": "Which data structure uses LIFO ordering?",
        "options": ["Queue", "Stack", "Array", "Linked List"],
        "correctAnswer": 1,
        "marks": 10
      },
      {
        "questionText": "What is the time complexity of binary search?",
        "options": ["O(n)", "O(n²)", "O(log n)", "O(1)"],
        "correctAnswer": 2,
        "marks": 10
      }
    ]'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Section 3: Seed notifications
-- ---------------------------------------------------------------------------

INSERT INTO notifications (user_id, title, message, is_read)
VALUES
  (
    'b0000000-0000-0000-0000-000000000002',
    'Welcome to CampusTest! 🎉',
    'Hello Sample Student! Your account is ready. Browse the available tests and start practising. Good luck!',
    FALSE
  )
ON CONFLICT DO NOTHING;
