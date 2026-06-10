"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.post('/sites', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const { siteUrl, siteName, username, applicationPassword } = req.body;
    if (!siteUrl)
        return res.status(400).json({ error: 'siteUrl is required' });
    try {
        const [site] = await db_1.db.insert(schema_1.wpSites).values({
            userId: user.id,
            siteUrl: siteUrl.replace(/\/$/, ''),
            siteName: siteName || siteUrl,
            username,
            applicationPassword,
        }).returning();
        res.json(site);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/sites', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    try {
        const sites = await db_1.db.select().from(schema_1.wpSites).where((0, drizzle_orm_1.eq)(schema_1.wpSites.userId, user.id));
        res.json(sites);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/sites/:id/posts', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const id = req.params.id;
    try {
        const [site] = await db_1.db.select().from(schema_1.wpSites).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.wpSites.id, id), (0, drizzle_orm_1.eq)(schema_1.wpSites.userId, user.id)));
        if (!site)
            return res.status(404).json({ error: 'Site not found' });
        const headers = { 'Content-Type': 'application/json' };
        if (site.username && site.applicationPassword) {
            headers['Authorization'] = 'Basic ' + Buffer.from(`${site.username}:${site.applicationPassword}`).toString('base64');
        }
        const wpRes = await fetch(`${site.siteUrl}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,status,date,link,excerpt`, {
            headers,
            signal: AbortSignal.timeout(10000),
        });
        if (!wpRes.ok)
            return res.status(wpRes.status).json({ error: 'WordPress API error' });
        const posts = await wpRes.json();
        res.json(posts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/sites/:id/posts', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const id = req.params.id;
    const { title, content, status = 'draft' } = req.body;
    try {
        const [site] = await db_1.db.select().from(schema_1.wpSites).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.wpSites.id, id), (0, drizzle_orm_1.eq)(schema_1.wpSites.userId, user.id)));
        if (!site)
            return res.status(404).json({ error: 'Site not found' });
        if (!site.username || !site.applicationPassword)
            return res.status(400).json({ error: 'Application password required to create posts' });
        const wpRes = await fetch(`${site.siteUrl}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${site.username}:${site.applicationPassword}`).toString('base64'),
            },
            body: JSON.stringify({ title, content, status }),
            signal: AbortSignal.timeout(10000),
        });
        if (!wpRes.ok)
            return res.status(wpRes.status).json({ error: 'WordPress API error' });
        const post = await wpRes.json();
        res.json(post);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/sites/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const id = req.params.id;
    try {
        await db_1.db.delete(schema_1.wpSites).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.wpSites.id, id), (0, drizzle_orm_1.eq)(schema_1.wpSites.userId, user.id)));
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
