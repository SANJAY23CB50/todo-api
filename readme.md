[Project URL](https://roadmap.sh/projects/todo-list-api)

A RESTful API for managing todo lists with user authentication.

## Tech Stack
- Node.js + Express
- JWT Authentication
- bcryptjs (password hashing)
- JSON file database

## How to Run

1. Clone the repository:
   git clone https://github.com/YOUR_USERNAME/todo-api.git
   cd todo-api

2. Install dependencies:
   npm install

3. Start the server:
   npm run dev

4. Server runs at: http://localhost:8080

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /register | Register new user | No |
| POST | /login | Login user | No |
| POST | /todos | Create todo | Yes |
| GET | /todos?page=1&limit=10 | Get all todos | Yes |
| PUT | /todos/:id | Update todo | Yes |
| DELETE | /todos/:id | Delete todo | Yes |

## Authentication
Add this header to protected routes:
Authorization: Bearer YOUR_TOKEN

## Example Requests

### Register
POST /register
{
  "name": "John Doe",
  "email": "john@doe.com",
  "password": "password123"
}

### Create Todo
POST /todos
{
  "title": "Buy groceries",
  "description": "Buy milk and eggs"
}
