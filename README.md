# Light Kids Management Platform

A comprehensive management and tracking platform built for Children's Church and Nursery programs. The system allows Administrators, Teachers/Mentors, and Parents to seamlessly track attendance, manage academic materials, post announcements, and securely manage child handoffs (drop-offs and pick-ups).

## Features

- **Secure Child Handoff System**: Generates a secure, unique 6-digit code for each registered child to ensure safe drop-offs and pick-ups. Parents and designated caregivers can use this code for verification.
- **Attendance Tracking**: Mentors and Teachers can log daily class attendance.
- **Academic & Sermon Materials**: An integrated feed allowing Mentors to upload Sermon Notes, Assignments, and worksheets for parents and children to access throughout the week.
- **Live Notice Board**: A centralized announcement system where Admins and Mentors can post updates (e.g., dress codes, events, scheduling changes).
- **Admin Management Hub**: Comprehensive statistics, user directories, and historical attendance logs available exclusively to administrators.
- **Role-Based Access Control**: Tailored dashboards and features for `ADMIN`, `MENTOR`, and `PARENT` roles.

## Architecture

This project is a monorepo managed with [Turborepo](https://turbo.build/repo). It contains two primary applications:

1. **`apps/web` (Frontend)**
   - Built with **Next.js** (App Router).
   - Styled with pure Vanilla CSS for maximum performance, using CSS variables and modern layout techniques (Glassmorphism, animations).
   - Fully responsive design.

2. **`apps/api` (Backend)**
   - Built with **NestJS**.
   - Database: **MongoDB** (using Mongoose for object modeling).
   - Authentication: JWT-based stateless authentication.
   - Core Modules: `Auth`, `Users`, `Children`, `Attendance`, `Materials`, `Handoff`, and `Admin`.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- MongoDB URI (Local or Atlas)

### Local Development

1. **Install Dependencies**
   From the root of the project, install dependencies for all workspaces:
   ```sh
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the `apps/api` directory:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster...
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   ```
   
   Create a `.env.local` file in the `apps/web` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Run the Development Servers**
   Use Turbo to start both the frontend and backend simultaneously:
   ```sh
   npm run dev
   ```
   - The Frontend will run on `http://localhost:3000`
   - The Backend API will run on `http://localhost:3001`

### Building for Production

To build all apps and packages, run the following command from the root:
```sh
npm run build
```

You can then deploy the `apps/web` folder to platforms like Vercel or Netlify, and host the `apps/api` server on platforms like Render, Railway, or Heroku. Ensure you configure your production environment variables respectively.

## Contributing
When adding new API routes, ensure you secure them using the `@UseGuards(AuthGuard('jwt'))` decorator. For Admin-only features, utilize role checking within your controllers.
