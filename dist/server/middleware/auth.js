import { auth } from '../auth';
export async function requireAuth(req, res, next) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
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
