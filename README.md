# ThoughtStream

ThoughtStream is a full-stack web application for creating, managing, and exploring book notes. Users can register, log in, and maintain a personal library of notes with the option to make them public or private.

---

## Features

- Create, edit, and delete book notes
- User signup and login with session support
- Option to mark notes as public or private
- Explore public notes from other users
- View and manage your personal note library

---

## Technologies Used

- Node.js with Express.js for the backend
- EJS for templating and rendering dynamic pages
- PostgreSQL for data storage
- express-session for session handling
- dotenv for environment variable management

---

## Installation

### 1. Clone the Repository

git clone https://github.com/BalaVignesh29092005/ThoughtStream.git
cd ThoughtStream

Install Dependencies
npm install

Configure Environment Variables
Create a .env file in the root directory and add the following:

PORT=3000
SESSION_SECRET=your_secret_key
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_NAME=notes
DB_PORT=5432

 Set Up the Database
Make sure PostgreSQL is installed and running. Create the database and tables:
CREATE DATABASE notes;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  age INT,
  sex VARCHAR(10),
  dob DATE,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(100)
);

CREATE TABLE booknotes (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(20),
  title TEXT,
  author TEXT,
  rating INT,
  dor DATE,
  intro TEXT,
  note TEXT,
  booklink TEXT,
  access_type VARCHAR(20),
  username VARCHAR(50)
);

Start the Application

npm start
The application will be available at http://localhost:3000
