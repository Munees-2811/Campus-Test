const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const supabase = require('../config/supabaseClient');

async function seedArenas() {
  console.log('--- Seeding Specialized Arena Tests ---');

  // Find admin
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const adminId = admin ? admin.id : 'a0000000-0000-0000-0000-000000000001';

  // Find all students
  const { data: students } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'student');

  console.log(`Found ${(students || []).length} students to assign.`);

  const newTests = [
    {
      id: 'e0000000-0000-0000-0000-000000000005',
      title: 'Data Structures & Algorithm Coding Sprint',
      category: 'Coding',
      description: 'Hands-on programming challenges testing array manipulation, hash maps, and recursion.',
      duration_minutes: 45,
      total_marks: 30,
      pass_marks: 15,
      is_active: true,
      created_by: adminId,
      questions: [
        {
          questionText: 'Given an array of integers nums and an integer target, which algorithmic approach finds two numbers such that they add up to target in O(N) time complexity?',
          options: [
            'Nested brute-force iterations comparing each pair O(N^2)',
            'Hash Map storing complement values and their indices in O(N)',
            'Linear search with randomized pivot sorting O(N log N)',
            'Binary search on an unsorted array O(log N)'
          ],
          correctAnswer: 1,
          marks: 10,
          type: 'coding'
        },
        {
          questionText: 'In a singly linked list, what is the optimal algorithm to detect whether a cycle exists using O(1) auxiliary space?',
          options: [
            'Hash Set storing visited node references',
            'Floyd\'s Tortoise and Hare two-pointer algorithm',
            'Recursive backtracking with call stack memoization',
            'Modifying node values to negative sentinel numbers'
          ],
          correctAnswer: 1,
          marks: 10,
          type: 'coding'
        },
        {
          questionText: 'What is the time complexity of pushing an element to a priority queue implemented with a binary heap containing N elements?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctAnswer: 1,
          marks: 10,
          type: 'coding'
        }
      ]
    },
    {
      id: 'f0000000-0000-0000-0000-000000000006',
      title: 'JavaScript & React Bug Squashing Arena',
      category: 'Debugging',
      description: 'Diagnose runtime exceptions, stale closures, memory leaks, and asynchronous race conditions.',
      duration_minutes: 30,
      total_marks: 20,
      pass_marks: 10,
      is_active: true,
      created_by: adminId,
      questions: [
        {
          questionText: 'Identify the bug: In React 18, why does `setCount(count + 1); setCount(count + 1);` inside an event handler only increment count by 1 instead of 2?',
          options: [
            'State updates are asynchronous and batched using the captured state from render closure',
            'React prohibits multiple state setter calls inside the same execution frame',
            'The component must be wrapped in React.memo to enable atomic batching',
            'useState hook automatically reverts consecutive identical calls'
          ],
          correctAnswer: 0,
          marks: 10,
          type: 'debugging'
        },
        {
          questionText: 'Spot the bug in this Node.js snippet: `fs.readFile(file, (err, data) => { res.send(data); }); res.end();`',
          options: [
            'res.end() executes before the asynchronous file read callback finishes, closing response prematurely',
            'fs.readFile requires synchronous execution with readFileSync in Express',
            'data buffer cannot be directly passed to res.send',
            'Callback function must return a Promise to prevent process exit'
          ],
          correctAnswer: 0,
          marks: 10,
          type: 'debugging'
        }
      ]
    },
    {
      id: 'a1000000-0000-0000-0000-000000000007',
      title: 'Relational Database & SQL Query Mastery',
      category: 'SQL',
      description: 'Complex SQL queries, multi-table JOINs, subqueries, indexing strategies, and ACID transactions.',
      duration_minutes: 35,
      total_marks: 25,
      pass_marks: 12,
      is_active: true,
      created_by: adminId,
      questions: [
        {
          questionText: 'Which SQL clause is used to filter aggregated group results produced by GROUP BY?',
          options: ['WHERE', 'HAVING', 'QUALIFY', 'ORDER BY'],
          correctAnswer: 1,
          marks: 8,
          type: 'multiple_choice'
        },
        {
          questionText: 'Consider tables `students` and `enrollments`. Which JOIN returns all students, including those who have not enrolled in any course?',
          options: [
            'INNER JOIN',
            'LEFT OUTER JOIN',
            'CROSS JOIN',
            'NATURAL JOIN'
          ],
          correctAnswer: 1,
          marks: 8,
          type: 'multiple_choice'
        },
        {
          questionText: 'In PostgreSQL, which index type is best suited for equality and range queries on standard numeric and text columns?',
          options: ['B-tree Index', 'GIN Index', 'Hash Index', 'BRIN Index'],
          correctAnswer: 0,
          marks: 9,
          type: 'multiple_choice'
        }
      ]
    }
  ];

  // Upsert tests
  for (const t of newTests) {
    const { error } = await supabase.from('tests').upsert(t, { onConflict: 'id' });
    if (error) console.error(`Error inserting test ${t.title}:`, error.message);
    else console.log(`✓ Inserted/Verified test: ${t.title} [Category: ${t.category}]`);
  }

  // Fetch all active tests
  const { data: allTests } = await supabase.from('tests').select('id, title, category');

  // Assign every test to every student so they are immediately available!
  let assignedCount = 0;
  for (const st of (students || [])) {
    for (const t of (allTests || [])) {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const { error } = await supabase.from('assignments').upsert({
        test_id: t.id,
        student_id: st.id,
        assigned_by: adminId,
        due_date: dueDate.toISOString(),
        status: 'pending'
      }, { onConflict: 'test_id,student_id' });

      if (!error) assignedCount++;
    }
  }

  console.log(`✓ Created/Verified ${assignedCount} student assignments in assignments table.`);
  console.log('--- Seeding Complete ---');
}

seedArenas()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
