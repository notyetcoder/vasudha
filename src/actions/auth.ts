'use server';

import { authenticateAdmin, addAdmin, deleteAdmin, type AdminUser } from '@/lib/admin-data';
import { z } from 'zod';

export async function login(username: string, passwordAttempt: string): Promise<AdminUser | { error: string }> {
    try {
        const adminUserWithPassword = await authenticateAdmin(username, passwordAttempt);
        if (adminUserWithPassword) {
            // Don't send the password to the client
            const { password, ...safeUser } = adminUserWithPassword;
            return safeUser;
        }
        return { error: 'Invalid username or password.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { error: message };
    }
}


const AddAdminSchema = z.object({
    name: z.string().min(2),
    username: z.string().min(4),
    password: z.string().min(8),
    role: z.enum(['super-admin', 'editor']),
});
type AddAdminData = z.infer<typeof AddAdminSchema>;


export async function createAdmin(values: AddAdminData): Promise<{ success: boolean; message: string }> {
    try {
        await addAdmin(values);
        return { success: true, message: `User ${values.name} has been added as an ${values.role}.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: message };
    }
}

export async function removeAdmin(idToDelete: string, currentAdminId: string): Promise<{ success: boolean; message: string }> {
    try {
        await deleteAdmin(idToDelete, currentAdminId);
        return { success: true, message: 'Admin user has been removed.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: message };
    }
}
