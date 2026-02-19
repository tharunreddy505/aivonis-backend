-- Create database and user for AIvonis
CREATE DATABASE aivonis;
CREATE USER aivonis_user WITH PASSWORD 'YourSecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE aivonis TO aivonis_user;
ALTER DATABASE aivonis OWNER TO aivonis_user;
