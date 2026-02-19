import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
    // Matcher excluding API routes, static files, and explicit public routes unless needed for auth protection logic
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
