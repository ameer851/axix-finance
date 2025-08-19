# Axix Finance

A modern financial management platform built with React, TypeScript, and Node.js.

## Features

- **Secure Authentication**: Email verification, password reset, and 2FA
- **User Dashboard**: View account balances, transaction history, and financial analytics
- **Transaction Management**: Deposit, withdraw, transfer, and invest funds
- **Real-time Notifications**: Stay updated on account activity and important alerts
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Deployment Guide

### Prerequisites

- Supabase account (for database and authentication)
- Vercel account (for hosting)
- Resend API key (for email services)

### Deployment Steps

1. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration scripts in the `migrations` folder
   - Note your Supabase URL and anon key

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set the following environment variables:
     ```
     SUPABASE_PROJECT_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     RESEND_API_KEY=your-resend-api-key
     EMAIL_FROM=noreply@yourdomain.com
     EMAIL_FROM_NAME=Axix Finance
     ```
   - Deploy using the provided `vercel.json` configuration

3. **Post-Deployment**
   - Verify database connections
   - Test authentication flows
   - Check email functionality

## Technology Stack

### Frontend

- React 18
- TypeScript
- React Query for data fetching
- React Router for navigation
- Tailwind CSS for styling
- React Hook Form for form handling
- Recharts for data visualization

### Backend

- Node.js
- Express
- PostgreSQL with Drizzle ORM
- JSON Web Tokens (JWT) for authentication
- ZOD for validation
- Winston for logging
- Resend API for email delivery with SMTP fallback

### Infrastructure

- Docker containers
- Docker Compose for local development
- Multi-stage Docker builds for production optimization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use the provided Docker setup)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/axix-finance.git
cd axix-finance
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Configure the email service (recommended):

```bash
# Set up Resend email service (recommended)
npm run email:setup:resend

# Or manually configure email settings in .env file
```

5. Start the development environment:

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or start the server and client separately
npm run dev:server
npm run dev:client
```

6. Access the application:

- Frontend: http://localhost:4000
- Backend API: http://localhost:5000

## Environment Variables

See `.env.example` for a complete list of environment variables. Critical variables include:

- `DATABASE_URL`: PostgreSQL connection string
- `RESEND_API_KEY`: API key for Resend email service (recommended)
- `SMTP_USER` and `SMTP_PASSWORD`: Credentials for SMTP fallback
- `JWT_SECRET`: Secret key for JWT tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Email service configuration (Brevo)
- `ETHEREAL_USER`, `ETHEREAL_PASS`: Development email testing configuration
- `NODE_ENV`: Environment ('development', 'test', or 'production')

## Project Structure

```
├── client/                # Frontend React application
│   ├── public/            # Static assets
│   └── src/
│       ├── assets/        # Images, videos, fonts
│       ├── components/    # Reusable React components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       ├── layouts/       # Page layout components
│       ├── lib/           # Utilities and helpers
│       ├── pages/         # Page components
│       └── services/      # API services
├── migrations/            # Database migrations
├── server/                # Backend Node.js application
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── emailService.ts    # Email service
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data access layer
├── shared/                # Shared code between client and server
│   └── schema.ts          # TypeScript types and schemas
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker container definition
└── package.json           # Project dependencies and scripts
```

## Documentation

### Email Service

The project uses Resend API as the primary email service with SMTP fallback:

- **Primary**: [Resend API](https://resend.com) for reliable email delivery and analytics
- **Fallback**: Gmail SMTP with App Password authentication
- **Multi-Provider**: Automatic fallback ensures maximum email deliverability
- **Simple Setup**: Easy configuration with `npm run email:setup:resend`

See [Email Service Documentation](docs/email-service-documentation.md) for details.

- **High Deliverability**: Reliable email delivery backed by Google

Documentation:

- [Email Service Documentation](docs/email-service-documentation.md): Comprehensive guide to the Gmail SMTP setup
- [Gmail SMTP Setup](docs/gmail-smtp-setup.md): Step-by-step Gmail configuration guide

### API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in an existing user
- `POST /api/auth/logout`: Log out the current user
- `GET /api/auth/verify-email`: Verify a user's email address
- `POST /api/auth/forgot-password`: Request a password reset
- `POST /api/auth/reset-password`: Reset a user's password

### User

- `GET /api/profile`: Get the current user's profile
- `PUT /api/profile`: Update the current user's profile
- `POST /api/change-password`: Change the current user's password

### Transactions

- `POST /api/transactions`: Create a new transaction
- `GET /api/transactions`: Get transactions with optional filtering
- `GET /api/transactions/:id`: Get a single transaction
- `PATCH /api/transactions/:id/status`: Update transaction status

### Messages

- `POST /api/messages`: Create a new support message
- `GET /api/messages`: Get messages with optional filtering
- `GET /api/messages/:id`: Get a single message
- `PATCH /api/messages/:id/status`: Update message status
- `DELETE /api/messages/:id`: Delete a message

### Notifications

- `GET /api/notifications`: Get notifications for the current user
- `GET /api/notifications/unread-count`: Get unread notification count
- `PATCH /api/notifications/:id/read`: Mark a notification as read
- `PATCH /api/notifications/mark-all-read`: Mark all notifications as read
- `DELETE /api/notifications/:id`: Delete a notification
- `GET /api/notifications/preferences`: Get notification preferences
- `PATCH /api/notifications/preferences`: Update notification preferences

## Docker Deployment

The application is containerized and can be deployed using Docker:

```bash
# Build the Docker image
docker build -t axix-finance .

# Run the container
docker run -p 4000:4000 -e DATABASE_URL=postgres://user:password@host:port/db axix-finance
```

For production deployment, use Docker Compose:

```bash
# Start the application stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Production Deployment

### Quick Deployment Guide

1. **Prepare for deployment:**

   ```bash
   npm run deploy:prepare
   npm run deploy:secrets
   ```

2. **Deploy to Render (Backend) and Vercel (Frontend):**
   - Follow the detailed guide in `docs/deployment-guide.md`
   - Use the checklist in `DEPLOYMENT-CHECKLIST.md`

### Deployment Architecture

- **Backend**: Render (Node.js + PostgreSQL)
- **Frontend**: Vercel (Static hosting)
- **Email**: Gmail SMTP
- **Domain**: Custom domain with SSL

### Cost: ~$180/year

- Render: $14/month (backend + database)
- Vercel: Free (frontend)
- Domain: ~$12/year

## Troubleshooting

### CORS Configuration

If you encounter CORS errors during development:

1. Make sure your backend server has the correct CORS configuration:

```typescript
import cors from "cors";

// CORS configuration for development
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:4000", // Your frontend URL
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
      ],
    })
  );
} else {
  // Production CORS settings
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "https://axix-finance.co",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}
```

2. Test the connection with:

```javascript
fetch("http://localhost:5000/api/health", {
  method: "GET",
  credentials: "include",
  headers: { Accept: "application/json" },
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

### Database Issues

If you encounter database-related errors:

1. Make sure your PostgreSQL server is running
2. Verify DATABASE_URL in your .env file is correct
3. Apply database migrations with:

```bash
npm run db:push
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- [Your Name](https://github.com/yourusername) - Initial work

## Fly.io Deployment

For deploying this app on Fly.io, see `docs/DEPLOY_TO_FLY.md`.
