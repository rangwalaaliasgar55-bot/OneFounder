"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
async function logActivity(userId, action, module, entityId, metadata) {
    try {
        await db_1.db.insert(schema_1.userActivityLog).values({
            userId,
            action,
            module,
            entityId: entityId || null,
            metadata: metadata || {},
        });
    }
    catch { }
}
