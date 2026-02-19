import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/");
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            // Allow access to public routes
            if (
                nextUrl.pathname.startsWith("/api/auth") ||
                nextUrl.pathname.startsWith("/api/test-auth") ||
                nextUrl.pathname.startsWith("/forgot-password") ||
                nextUrl.pathname.startsWith("/reset-password") ||
                nextUrl.pathname.startsWith("/register") ||
                nextUrl.pathname.startsWith("/_next") ||
                nextUrl.pathname.startsWith("/static") ||
                nextUrl.pathname.startsWith("/favicon.ico") ||
                nextUrl.pathname.startsWith("/api/voice") ||
                nextUrl.pathname.startsWith("/api/recording")
            ) {
                return true;
            }

            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.assignedAgentId = user.assignedAgentId;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                if (token.sub) {
                    session.user.id = token.sub;
                }
                session.user.role = token.role as "admin" | "staff" | undefined;
                session.user.assignedAgentId = token.assignedAgentId as string | undefined;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
