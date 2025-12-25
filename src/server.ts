import app from "./app.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 5000;

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LMS API",
      version: "1.0.0",
      description: "API documentation for your LMS backend",
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${PORT}`,
      },
    ],
  },
  // Adjust this to where your route files live
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Mount swagger AFTER app is created and routes are set up
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Graceful shutdown handler
const shutdown = () => {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📄 Swagger docs available at ${process.env.BASE_URL || `http://localhost:${PORT}`}/api-docs`);
  console.log(`❤️  Health check available at ${process.env.BASE_URL || `http://localhost:${PORT}`}/api/health`);
});
