import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

// `auth` is created lazily — called after mongoose connects so that
// mongoose.connection.getClient() returns a live MongoClient.
let _auth = null;

export function getAuth() {
  if (!_auth) {
    throw new Error(
      "Auth not initialized. Call initAuth() after connecting to MongoDB."
    );
  }
  return _auth;
}

export function initAuth() {
  if (_auth) return _auth;

  const mongoClient = mongoose.connection.getClient();
  if (!mongoClient) {
    throw new Error(
      "Mongoose MongoClient is not available. Ensure mongoose is connected before calling initAuth()."
    );
  }
  const db = mongoClient.db();

  const isProd = process.env.NODE_ENV === "production";

  _auth = betterAuth({
    database: mongodbAdapter(db, { client: mongoClient }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    // Both the frontend and backend origins must be trusted so that
    // better-auth allows the cross-domain OAuth redirect to succeed.
    trustedOrigins: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.BETTER_AUTH_URL || "http://localhost:5000",
    ],

    emailAndPassword: {
      enabled: true,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },

    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,     // 1 day
    },

    advanced: {
      // In production the frontend (dream-drive.vercel.app) and backend
      // (dream-drive-server.vercel.app) are on different domains, so the
      // OAuth state cookie must be SameSite=None; Secure, otherwise the
      // browser drops it during the Google redirect and you get state_mismatch.
      useSecureCookies: isProd,
      crossSubdomainCookies: {
        enabled: isProd,
      },
      defaultCookieAttributes: {
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        httpOnly: true,
      },
    },
  });

  return _auth;
}
