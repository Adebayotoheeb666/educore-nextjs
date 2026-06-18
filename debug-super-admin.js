const { createClient } = require('@libsql/client');
const client = createClient({
  url: 'libsql://educore-educore.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzkwMjgwMjIsImlkIjoiMDE5ZTM2NGYtYTcwMS03MmQ4LTk1MDgtNWI1NWRjMzU1Yjc3IiwicmlkIjoiMjk5OWU0YjAtYzUzNC00ZTA5LTk4YWEtM2JlY2RhMjlhOTFiIn0.83ytO4V_0CuMzGEWiH5qwk4MExlfdkXgTt-VVGf19y7vB7K9pwk5zWgeUipgm--pYNJziFYqBr_tmrQQ4b5cAw'
});

(async () => {
  try {
    const x = await client.execute("SELECT id, name, email, phone, password, role, is_active, admission_no FROM users WHERE role != 'student' LIMIT 20;");
    console.log('non-students', JSON.stringify(x, null, 2));
    const y = await client.execute('SELECT id, name, email, phone, password, role, is_active, admission_no FROM users WHERE LOWER(email) = ?', ['admin@educore.ng']);
    console.log('lower-email match', JSON.stringify(y, null, 2));
    const z = await client.execute('SELECT id, name, email, phone, password, role, is_active, admission_no FROM users WHERE email LIKE ?', ['%admin@educore.ng%']);
    console.log('like-email match', JSON.stringify(z, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
