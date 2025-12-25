import express from "express";
import authRoutes from "./routes/authRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js"
import studentRoutes from "./routes/studentRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import prisma from "./config/db.js";

const app = express();
app.set("trust proxy", 1);
// Swagger configuration
const swaggerOptions = {
  definition: {
    info: {
      title: 'LMS Backend API',
      version: '1.0.0',
      description: 'Learning Management System API with comprehensive course, quiz, and lesson management',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
         url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Course ID' },
            title: { type: 'string', description: 'Course title' },
            description: { type: 'string', description: 'Course description' },
            category: { type: 'string', description: 'Course category' },
            level: { type: 'string', description: 'Course level (beginner, intermediate, advanced)' },
            price: { type: 'number', description: 'Course price' },
            currency: { type: 'string', description: 'Currency code' },
            duration: { type: 'number', description: 'Course duration in minutes' },
            image: { type: 'string', description: 'Course image URL' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED'], description: 'Course status' },
            rating: { type: 'number', description: 'Course rating' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Course tags' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LMS API Documentation',
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://devrecschool.netlify.app'
].filter(Boolean);

// app.use(cors({
//   origin: function(origin, callback) {
//     // Allow requests with no origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);
    
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(null, origin); // In production, you might want to restrict this
//     }
//   },
//   credentials: true,
// }));


app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'LMS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


app.get('/api/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ users });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'DB connection failed', error: errorMessage });
  }
});
// Add student course routes
app.use('/api', studentRoutes);
app.use('/api', instructorRoutes);
app.use("/api/user" , userRoutes);
app.use("/api/auth", authRoutes);



export default app;
