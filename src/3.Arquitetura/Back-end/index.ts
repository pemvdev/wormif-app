import { Hono } from "hono";
import { diagnosticoController } from "./controller/DiagnosticoController";

const app = new Hono<{ Bindings: Env }>();

// API Routes
app.route('/api/diagnostico', diagnosticoController);

export default app;
