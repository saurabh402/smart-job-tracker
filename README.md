# Smart Job Tracker

A full-stack app for organizing job and internship applications. Track each opportunity, its current status, and interview details from a browser dashboard.

## Features

- Create, view, update, and delete applications
- Track company, role, location, job type, salary, application date, job URL, and notes
- Record interview dates, times, rounds, format, interviewer, and notes
- Organize applications by status: Applied, Interview, Selected, Rejected, or On Hold
- Register and sign in with a user account
- Use the dashboard in light or dark mode

## Requirements

- Node.js 18 or later
- MongoDB running locally, or a MongoDB connection URI

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (optional when using the defaults):

   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/smart_job_tracker
   JWT_SECRET=replace_with_a_long_random_secret
   ```

   `MONGODB_URI` defaults to the local MongoDB URI shown above. Set `JWT_SECRET` to a long, unique value before using accounts outside local development; the server has a development fallback if it is omitted.

3. Start the server:

   ```bash
   npm start
   ```

   For development with automatic restarts:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. If you set a different `PORT`, use that port instead.

## Using the app

Create an account or continue in guest mode, then add applications from the dashboard. Signed-in applications are associated with the account. Guest mode is shared and unauthenticated; do not use it for private application data.

## API overview

All endpoints are served from the same origin as the frontend. JSON request bodies are used for POST and PUT requests.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register with a name, email, and password (at least 6 characters) |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `GET` | `/api/auth/me` | Get the current account; requires a bearer token |
| `GET` | `/api/applications` | List applications |
| `GET` | `/api/applications/:id` | Get one application |
| `POST` | `/api/applications` | Create an application; `company` and `role` are required |
| `PUT` | `/api/applications/:id` | Update an application |
| `DELETE` | `/api/applications/:id` | Delete an application |

Successful registration and login responses include a JWT. Send it on authenticated requests using `Authorization: Bearer <token>`.

## Project structure

```text
models/
  Application.js       Mongoose application schema
  User.js              Mongoose user schema and password hashing
public/
  index.html           Home page
  login.html           Sign-in page
  signup.html          Registration page
  dashboard.html       Application dashboard
  add-application.html Application form
  css/main.css         Shared styles
  js/api.js            Frontend API and UI helpers
server.js              Express server, API routes, and static hosting
```

## Scripts

- `npm start` starts the server.
- `npm run dev` starts the server with Node's watch mode.
- `npm test` is currently a placeholder; automated tests are not configured.
