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
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📄 Swagger docs available at http://localhost:${PORT}/api-docs`);
});
//# sourceMappingURL=server.js.map