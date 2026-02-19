import prisma from './prisma';
import bcrypt from 'bcryptjs';

export interface User {
    id: string;
    email: string;
    password: string; // Hashed in database
    name: string;
    role: 'admin' | 'staff';
    assignedAgentId?: string | null;
    createdAt: Date;
}

export async function getUsers(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map(u => ({
        ...u,
        role: u.role as 'admin' | 'staff',
        assignedAgentId: u.assignedAgentId || undefined
    }));
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) return undefined;
    return {
        ...user,
        role: user.role as 'admin' | 'staff',
        assignedAgentId: user.assignedAgentId || undefined
    };
}

export async function getUserById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
        where: { id }
    });
    if (!user) return undefined;
    return {
        ...user,
        role: user.role as 'admin' | 'staff',
        assignedAgentId: user.assignedAgentId || undefined
    };
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await prisma.user.create({
        data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            assignedAgentId: userData.assignedAgentId || null
        }
    });

    console.log(`[Users] Created user: ${newUser.email} (ID: ${newUser.id})`);

    return {
        ...newUser,
        role: newUser.role as 'admin' | 'staff',
        assignedAgentId: newUser.assignedAgentId || undefined
    };
}

export async function deleteUser(id: string): Promise<boolean> {
    try {
        await prisma.user.delete({
            where: { id }
        });
        return true;
    } catch (error) {
        console.error(`[Users] Error deleting user ${id}:`, error);
        return false;
    }
}

export async function deleteUserByAgentId(agentId: string): Promise<boolean> {
    try {
        const result = await prisma.user.deleteMany({
            where: { assignedAgentId: agentId }
        });
        return result.count > 0;
    } catch (error) {
        console.error(`[Users] Error deleting users for agent ${agentId}:`, error);
        return false;
    }
}
