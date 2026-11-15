require('dotenv').config({ path: __dirname + '/../../.env' });
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');

const seedData = async () => {
  try {
    console.log('Clearing existing data...');
    await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Creating users...');
    const adminHash = await bcrypt.hash('Password123!', 10);
    const studentHash = await bcrypt.hash('Password123!', 10);

    const { data: admin, error: adminErr } = await supabase.from('profiles')
      .insert({ name: 'Campus Administrator', email: 'admin@campus.edu', password_hash: adminHash, role: 'admin' })
      .select('id').single();
    if (adminErr) throw adminErr;

    const { data: student, error: studentErr } = await supabase.from('profiles')
      .insert({ name: 'John Student', email: 'student@campus.edu', password_hash: studentHash, role: 'student' })
      .select('id').single();
    if (studentErr) throw studentErr;

    console.log('Creating sample tests...');
    const test1Questions = [
      { questionText: 'Which React hook handles side effects?', options: ['useState', 'useEffect', 'useMemo', 'useContext'], correctAnswer: 1, marks: 1 },
      { questionText: 'What HTTP method creates a new resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswer: 1, marks: 1 },
      { questionText: 'In MongoDB, what is a group of documents?', options: ['Table', 'Row', 'Collection', 'Schema'], correctAnswer: 2, marks: 1 },
      { questionText: 'What does JWT stand for?', options: ['Java Web Token', 'JSON Web Token', 'JavaScript Web Tool', 'Joint Wireless Transport'], correctAnswer: 1, marks: 1 },
    ];
    const totalMarks1 = test1Questions.reduce((s, q) => s + q.marks, 0);

    const { error: t1Err } = await supabase.from('tests').insert({
      title: 'Full-Stack JavaScript & React Assessment',
      description: 'Covers React hooks, Express routing, and MongoDB concepts.',
      category: 'Technical',
      duration_minutes: 15,
      is_active: true,
      created_by: admin.id,
      questions: test1Questions,
      total_marks: totalMarks1,
      pass_marks: Math.ceil(totalMarks1 * 0.4),
    });
    if (t1Err) throw t1Err;

    const test2Questions = [
      { questionText: 'If a train runs at 60 km/h, how many meters per second?', options: ['16.67 meters', '15.5 meters', '18.2 meters', '20.0 meters'], correctAnswer: 0, marks: 1 },
      { questionText: 'Which number completes: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '48'], correctAnswer: 1, marks: 1 },
    ];
    const totalMarks2 = test2Questions.reduce((s, q) => s + q.marks, 0);

    const { error: t2Err } = await supabase.from('tests').insert({
      title: 'Campus Aptitude & Logical Reasoning',
      description: 'General aptitude for campus placements.',
      category: 'Aptitude',
      duration_minutes: 20,
      is_active: true,
      created_by: admin.id,
      questions: test2Questions,
      total_marks: totalMarks2,
      pass_marks: Math.ceil(totalMarks2 * 0.4),
    });
    if (t2Err) throw t2Err;

    console.log('Seeding complete!');
    console.log('Admin:   admin@campus.edu   / Password123!');
    console.log('Student: student@campus.edu / Password123!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
