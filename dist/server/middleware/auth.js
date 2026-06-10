"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const auth_1 = require("../auth");
async function requireAuth(req, res, next) {
    try {
        const session = await auth_1.auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = session.user;
        req.session = session.session;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
