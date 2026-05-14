import { Application } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export const swaggerDoc = (app: Application) => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Royal Palace Hotel Booking API Documentation",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:5000", description: "Development Server" }],
    },

    apis: ["./src/app/routes/**/*route.ts"], // files containing annotations as above
  };

  const openapiSpecification = swaggerJsdoc(options);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));
};
