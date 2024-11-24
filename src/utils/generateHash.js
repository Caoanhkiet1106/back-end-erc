const bcrypt = require('bcryptjs');

const password = "admin123456"; // password mới, dễ nhớ
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed password:', hash);
    
    // In ra câu lệnh MongoDB
    const command = `db.users.insertOne({
    username: "admin",
    password: "${hash}",
    email: "admin@example.com",
    role: "admin"
})`;
    
    console.log('\nMongoDB Command:');
    console.log(command);
}); 