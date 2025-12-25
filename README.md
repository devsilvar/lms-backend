# LMS Backend API

A comprehensive Learning Management System backend built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Deploy to Render

**Want to deploy in 10 minutes?** → Read [QUICK_START.md](./QUICK_START.md)

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Deploy to Render in 10 minutes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide with troubleshooting
- **[RENDER_CHECKLIST.md](./RENDER_CHECKLIST.md)** - Step-by-step deployment checklist
- **[.env.example](./.env.example)** - Environment variables template

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Aiven)
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email**: SMTP (Zeptomail)
- **API Docs**: Swagger/OpenAPI

## 📋 Features

- ✅ User authentication (JWT with refresh tokens)
- ✅ Role-based access control (Admin, Instructor, Student)
- ✅ Course management (CRUD operations)
- ✅ Curriculum and lesson management
- ✅ Quiz and assessment system
- ✅ File upload to Cloudinary
- ✅ Email notifications
- ✅ Course enrollment
- ✅ Reviews and ratings
- ✅ API documentation (Swagger)
- ✅ Health check endpoint

## 🚀 Local Development

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Cloudinary account
- SMTP email service

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd lms-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Seed database (optional)**
   ```bash
   npm run seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

Server will run on `http://localhost:5000`

### Available Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm start                # Start production server
npm run migrate          # Run database migrations (dev)
npm run migrate:deploy   # Run migrations (production)
npm run seed             # Seed database with initial data
```

## 🌐 API Documentation

Once the server is running, visit:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/api/health`

## 📁 Project Structure

```
lms-backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Database seeding script
├── src/
│   ├── config/            # Configuration files
│   │   ├── db.ts         # Database connection
│   │   ├── cloudinary.ts # Cloudinary setup
│   │   └── mailer.ts     # Email configuration
│   ├── controllers/       # Route controllers
│   │   ├── authControllers.ts
│   │   ├── instructorControllers.ts
│   │   ├── studentControllers.ts
│   │   └── courses/      # Course-related controllers
│   ├── middlewares/       # Express middlewares
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddlewares.ts
│   │   └── uploadMiddleware.ts
│   ├── routes/           # API routes
│   │   ├── authRoutes.ts
│   │   ├── instructorRoutes.ts
│   │   ├── studentRoutes.ts
│   │   └── userRoutes.ts
│   ├── utils/            # Utility functions
│   │   ├── token.ts
│   │   ├── password.ts
│   │   └── email.ts
│   ├── lib/              # Libraries
│   │   └── prismaError.ts
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── .env.example          # Environment variables template
├── render.yaml           # Render deployment config
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔒 Environment Variables

See [.env.example](./.env.example) for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `CLOUDINARY_*` - Cloudinary credentials
- `SMTP_*` - Email service credentials

## 🌍 Deployment

### Deploy to Render

1. **Quick Deploy** (10 minutes)
   - Follow [QUICK_START.md](./QUICK_START.md)

2. **Detailed Guide** (with troubleshooting)
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

3. **Step-by-Step Checklist**
   - Use [RENDER_CHECKLIST.md](./RENDER_CHECKLIST.md)

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Health check endpoint responding
- [ ] API documentation accessible
- [ ] CORS configured for frontend
- [ ] SSL enabled (automatic on Render)
- [ ] Logs monitoring set up

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Courses (Student)
- `GET /api/courses` - Get all approved courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/my-courses` - Get enrolled courses

### Courses (Instructor)
- `POST /api/instructor/courses` - Create course
- `GET /api/instructor/courses` - Get instructor's courses
- `PUT /api/instructor/courses/:id` - Update course
- `DELETE /api/instructor/courses/:id` - Delete course

### Curriculum & Lessons
- `POST /api/instructor/courses/:id/curriculum` - Add curriculum
- `POST /api/instructor/curriculum/:id/lessons` - Add lesson
- `GET /api/courses/:id/curriculum` - Get course curriculum

### Quizzes
- `POST /api/instructor/curriculum/:id/quiz` - Create quiz
- `POST /api/quiz/:id/questions` - Add quiz questions
- `POST /api/quiz/:id/submit` - Submit quiz answers

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

See Swagger docs for complete API reference.

## 🧪 Testing

```bash
# Run tests (when available)
npm test

# Test specific endpoint
curl http://localhost:5000/api/health
```

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check DATABASE_URL format
postgres://username:password@host:port/database?sslmode=require

# For Aiven, ensure NODE_TLS_REJECT_UNAUTHORIZED=0 is set
```

**Prisma errors**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

**Port already in use**
```bash
# Change PORT in .env
PORT=5001
```

## 📊 Monitoring

- **Health Check**: `/api/health` - Returns server status
- **Logs**: Check Render dashboard or local console
- **Database**: Monitor via Aiven console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

[Your License Here]

## 📧 Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
- Review logs in Render dashboard
- Contact: [Your Contact Info]

## 🔗 Links

- **Frontend**: https://devrecschool.netlify.app
- **API Docs**: https://your-app.onrender.com/api-docs
- **Health Check**: https://your-app.onrender.com/api/health

---

**Ready to deploy?** → Start with [QUICK_START.md](./QUICK_START.md)
