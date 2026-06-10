"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const node_1 = require("better-auth/node");
const auth_1 = require("./auth");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ai_1 = __importDefault(require("./routes/ai"));
const ideas_1 = __importDefault(require("./routes/ideas"));
const research_1 = __importDefault(require("./routes/research"));
const plans_1 = __importDefault(require("./routes/plans"));
const projects_1 = __importDefault(require("./routes/projects"));
const content_1 = __importDefault(require("./routes/content"));
const leads_1 = __importDefault(require("./routes/leads"));
const knowledge_1 = __importDefault(require("./routes/knowledge"));
const chat_1 = __importDefault(require("./routes/chat"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const social_1 = __importDefault(require("./routes/social"));
const finance_1 = __importDefault(require("./routes/finance"));
const seo_1 = __importDefault(require("./routes/seo"));
const ceo_1 = __importDefault(require("./routes/ceo"));
const journey_1 = __importDefault(require("./routes/journey"));
const wordpress_1 = __importDefault(require("./routes/wordpress"));
const founderProfile_1 = __importDefault(require("./routes/founderProfile"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5000',
        process.env.CLIENT_URL || '',
        /\.replit\.dev$/,
        /\.repl\.co$/,
    ].filter(Boolean),
    credentials: true,
}));
app.all('/auth/*', (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/ai', ai_1.default);
app.use('/api/ideas', ideas_1.default);
app.use('/api/research', research_1.default);
app.use('/api/plans', plans_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/content', content_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/knowledge', knowledge_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/social', social_1.default);
app.use('/api/finance', finance_1.default);
app.use('/api/seo', seo_1.default);
app.use('/api/ceo', ceo_1.default);
app.use('/api/journey', journey_1.default);
app.use('/api/wordpress', wordpress_1.default);
app.use('/api/founder-profile', founderProfile_1.default);
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', version: '1.0.0', name: 'OneFounder' });
});
// Serve built client in production
if (process.env.NODE_ENV === 'production') {
    const clientDist = path_1.default.resolve(__dirname, '../client');
    app.use(express_1.default.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
}
app.listen(PORT, () => {
    console.log(`🚀 OneFounder server running on port ${PORT}`);
});
