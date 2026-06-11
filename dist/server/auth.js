"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const drizzle_1 = require("better-auth/adapters/drizzle");
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, drizzle_1.drizzleAdapter)(db_1.db, {
        provider: 'pg',
        schema: {
            user: schema_1.users,
            session: schema_1.sessions,
            account: schema_1.accounts,
            verification: schema_1.verifications,
        },
    }),
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET || 'onefoundr-secret-change-in-production',
    basePath: '/auth',
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        },
    },
    trustedOrigins: [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5173',
        process.env.CLIENT_URL || '',
    ].filter(Boolean),
});
