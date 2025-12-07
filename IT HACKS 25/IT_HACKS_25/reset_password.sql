UPDATE users SET password_hash = '$2b$12$xdgSRdoebEOnSj7CpP6kOevbqMJdvKNUMGgt7rQ.iLtq5PQ1gOwzS' WHERE email = 'joseph123nimyel@gmail.com';
SELECT id, email, password_hash FROM users WHERE email = 'joseph123nimyel@gmail.com';
