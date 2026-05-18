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

  // mongoose.connection.getClient() returns the underlying MongoClient.
  // .db() on that client gives us the Db instance the adapter needs.
  const mongoClient = mongoose.connection.getClient();
  if (!mongoClient) {
    throw new Error(
      "Mongoose MongoClient is not available. Ensure mongoose is connected before calling initAuth()."
    );
  }
  const db = mongoClient.db();

  _auth = betterAuth({
    // Pass both db and client so the adapter can use transactions.
    database: mongodbAdapter(db, { client: mongoClient }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    // CLIENT_URL must be trusted so better-auth allows redirecting back to
    // the React app after the Google OAuth callback.
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
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
  });

  return _auth;
}
