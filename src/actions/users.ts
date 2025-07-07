
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  addUser as addUserToMemory,
  type User,
  users,
  approveUser as approveUserInMemory,
  updateUser as updateUserInMemory,
  deleteUser as deleteUserInMemory,
  importUsers as importUsersInMemory,
} from '@/lib/data';

// Schema for user input from public form
const userSchema = z.object({
  surname: z.string().min(1, "Surname is required."),
  maidenName: z.string().min(1, "Maiden name is required."),
  name: z.string().min(1, "Name is required."),
  family: z.string().optional(),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married']),
  fatherName: z.string().min(1, "Father's name is required."),
  motherName: z.string().min(1, "Mother's name is required."),
  spouseName: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  description: z.string().optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  spouseId: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

type UserDataFromForm = z.infer<typeof userSchema>;

// Admin schema - allows some fields to be optional as they are handled by the admin UI
const adminUserSchema = userSchema.extend({});

type AdminUserDataFromForm = z.infer<typeof adminUserSchema>;

// Utility to revalidate relevant paths
function revalidateAllPaths(userId?: string) {
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/connect');
  revalidatePath('/explore');
  if (userId) {
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/tree/${userId}`);
  }
}

// Create user from public form
export async function createUser(data: UserDataFromForm): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const parsed = userSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const errorMessage = `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`;
      console.error("Zod validation failed:", parsed.error.flatten().fieldErrors);
      return { success: false, message: errorMessage };
    }

    const newUser = addUserToMemory(parsed.data);
    
    revalidateAllPaths();
    return { success: true, message: `Your profile has been submitted for approval. Your Unique ID is: ${newUser.id}`, userId: newUser.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
    console.error('Error in createUser:', error);
    return { success: false, message };
  }
}

// Create and approve user from admin panel
export async function adminCreateUser(data: AdminUserDataFromForm): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = adminUserSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const errorMessage = `Invalid admin input for ${firstError.path.join('.')}: ${firstError.message}`;
      console.error("Zod validation failed for admin create:", parsed.error.flatten().fieldErrors);
      return { success: false, message: errorMessage };
    }

    const newUser = addUserToMemory(parsed.data);
    approveUserInMemory(newUser.id);
    revalidateAllPaths(newUser.id);
    return { success: true, message: 'User created and approved successfully!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
    console.error('Error in adminCreateUser:', error);
    return { success: false, message };
  }
}

// Get all users
export async function getUsers(): Promise<User[]> {
  return users;
}

// Approve user by ID
export async function approveUserAction(id: string): Promise<{ success: boolean }> {
  try {
    approveUserInMemory(id);
    revalidateAllPaths(id);
    return { success: true };
  } catch (error) {
    console.error('Error in approveUserAction:', error);
    return { success: false };
  }
}

// Update user details
export async function updateUserAction(user: User): Promise<{ success: boolean }> {
  try {
    updateUserInMemory(user.id, user);
    revalidateAllPaths(user.id);
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserAction:', error);
    return { success: false };
  }
}

// Delete user by ID
export async function deleteUserAction(id: string): Promise<{ success: boolean }> {
  try {
    deleteUserInMemory(id);
    revalidateAllPaths();
    return { success: true };
  } catch (error) {
    console.error('Error in deleteUserAction:', error);
    return { success: false };
  }
}

// Bulk import users (admin only)
export async function importUsersAction(newUsers: Omit<User, 'id'>[]): Promise<{ success: boolean; message: string }> {
  try {
    const count = importUsersInMemory(newUsers);
    revalidateAllPaths();
    return { success: true, message: `${count} users imported successfully.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred during import.';
    console.error('Error in importUsersAction:', error);
    return { success: false, message };
  }
}
