require('dotenv').config({ path: __dirname + '/../../.env' });
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');

const initAdminCli = async () => {
  try {
    const name = process.argv[2] || 'Campus System Administrator';
    const email = (process.argv[3] || 'admin@campus.edu').toLowerCase().trim();
    const password = process.argv[4] || 'Password123!';

    console.log('[CampusTest Admin Initialization]');
    console.log(`Setting up admin: ${name} (${email})`);

    const { data: existing } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    const password_hash = await bcrypt.hash(password, 10);

    if (existing) {
      console.log(`Account with email ${email} already exists. Updating password & ensuring admin role...`);
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name,
          role: 'admin',
          password_hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateErr) throw updateErr;
      console.log('Admin account updated successfully!');
    } else {
      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          name,
          email,
          password_hash,
          role: 'admin'
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      console.log(`Admin account created successfully! ID: ${created.id}`);
    }

    console.log('----------------------------------------------------');
    console.log('Secure Admin Credentials:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('[Admin Init CLI Error]', err.message);
    process.exit(1);
  }
};

initAdminCli();
