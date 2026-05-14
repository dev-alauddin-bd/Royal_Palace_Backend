import { Application, Router } from "express";
import { userRoute } from "../routes/user.route";

import { bookingRoute } from "../routes/booking.route";
import { paymentRoute } from "../routes/payment.route";
import { roomRoute } from "../routes/room.route";
import { testimonialRoute } from "../routes/testimonial.route";
import { dashboardRoute } from "../routes/dashboard.route";
import { teamRoute } from "../routes/team.route";
import { authRoute } from "../routes/auth.route";


// -------------------
// 1. Route Interface
// -------------------
interface IRoute {
  path: string;
  handler: Router;
}

// -------------------
// 2. All routes
// -------------------
export const routes: IRoute[] = [
  { path: "/users", handler: userRoute },
  { path: "/rooms", handler: roomRoute },
  { path: "/bookings", handler: bookingRoute },
  { path: "/payments", handler: paymentRoute },

  { path: "/testimonials", handler: testimonialRoute },
  { path: "/dashboards", handler: dashboardRoute },
  { path: "/teams", handler: teamRoute },
  { path: "/auth", handler: authRoute },
];

// -------------------
// 3. Register main routes with common prefix
// -------------------
export const mainRoutes = (app: Application, apiPrefix = "/api") => {
  routes.forEach((route) => {
    app.use(`${apiPrefix}${route.path}`, route.handler);
  });
};
