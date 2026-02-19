import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/users";
import { User } from "./users";

// Extended user type to include role and assigned agent
declare module "next-auth" {
    interface User {
        role?: "admin" | "staff";
        assignedAgentId?: string;
    }
    interface Session {
        user: User & {
            role?: "admin" | "staff";
            assignedAgentId?: string;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role?: "admin" | "staff";
        assignedAgentId?: string;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    console.log('Authorize called with:', { email: credentials?.email });

                    if (!credentials?.email || !credentials?.password) {
                        console.log('Missing credentials');
                        return null;
                    }

                    // Find user by email
                    const user = await getUserByEmail(credentials.email as string);
                    console.log('User found:', user ? 'Yes' : 'No');

                    if (!user) {
                        return null;
                    }

                    // Emergency Bypass for Admin (Debugging)
                    if (credentials.email === 'admin@aivonis.ai' && credentials.password === 'admin123') {
                        console.log('Admin bypass triggered');
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            assignedAgentId: user.assignedAgentId || undefined,
                        };
                    }

                    // Verify password using bcryptjs
                    const passwordMatch = await bcrypt.compare(credentials.password as string, user.password);
                    console.log('Password match:', passwordMatch);

                    if (!passwordMatch) {
                        return null;
                    }

                    // Return user data
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        assignedAgentId: user.assignedAgentId || undefined,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.AUTH_SECRET || "KEQtYuGiW6d9oyZgcLppOkTpUzijtQvvRU131vWuOoVo=",
    trustHost: true,
});
