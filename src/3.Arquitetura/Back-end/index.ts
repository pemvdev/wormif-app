import { Hono } from "hono";
import { authController } from "./controller/AuthController";
import { diagnosticoController } from "./controller/DiagnosticoController";

const app = new Hono<{ Bindings: Env }>();

// API Routes
app.route('/api/auth', authController);
app.route('/api/diagnostico', diagnosticoController);

export default app;
