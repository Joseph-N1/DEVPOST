UPDATE users SET password_hash = '$2b$12$ALYmNBZioC3xEUvbu.u.qOuDx2BIFHv7.wrYw0KS0bUJxe5IpjTCC' WHERE email = 'joseph123nimyel@gmail.com';
SELECT email, password_hash FROM users WHERE email = 'joseph123nimyel@gmail.com';
