'use server';

import { revalidatePath } from 'next/cache';
import {
    addUser as addUserToMemory,
    type User,
    users,
    approveUser as approveUserInMemory,
    updateUser as updateUserInMemory,
    deleteUser as deleteUserInMemory,
    importUsers as importUsersInMemory,
} from '@/lib/data';

// The data type received from the public registration form
type UserDataFromForm = {
    surname: string;
    maidenName: string;
    name: string;
    family?: string;
    gender: 'male' | 'female';
    maritalStatus: 'single' | 'married';
    fatherName: string;
    motherName: string;
    spouseName?: string;
    birthMonth?: string;
    birthYear?: string;
    description?: string;
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    profilePictureUrl?: string;
};

// The data type received from the admin creation form
type AdminUserDataFromForm = Omit<UserDataFromForm, 'spouseName' | 'description'> & {
    spouseName: string; // no longer optional
    description: string; // no longer optional
}

export async function createUser(data: UserDataFromForm): Promise<{ success: boolean; message: string }> {
  try {
     // Ensure optional fields from the form are converted to empty strings
    // to match the `User` type before being passed to the data layer.
    const userForDb = {
        ...data,
        family: data.family || '',
        description: data.description || '',
        birthMonth: data.birthMonth || '',
        birthYear: data.birthYear || '',
    };
    addUserToMemory(userForDb);
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/connect');
    revalidatePath('/explore');
    return { success: true, message: 'Registration submitted successfully!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function adminCreateUser(data: AdminUserDataFromForm): Promise<{ success: boolean; message: string }> {
  try {
    // Ensure optional fields from the form are converted to empty strings
    // to match the `User` type before being passed to the data layer.
    const userForDb = {
        ...data,
        family: data.family || '',
        birthMonth: data.birthMonth || '',
        birthYear: data.birthYear || '',
    };
    const newUser = addUserToMemory(userForDb);
    // When an admin creates a user, they are approved by default
    approveUserInMemory(newUser.id);
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/connect');
    revalidatePath('/explore');
    return { success: true, message: 'User created and approved successfully!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}


export async function getUsers(): Promise<User[]> {
  return users;
}

export async function approveUserAction(id: string): Promise<{ success: boolean }> {
    try {
        approveUserInMemory(id);
        revalidatePath('/admin', 'layout');
        revalidatePath('/admin/connect');
        revalidatePath('/explore');
        const user = users.find(u => u.id === id);
        if (user) {
            revalidatePath(`/profile/${user.id}`);
        }
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function updateUserAction(user: User): Promise<{ success: boolean }> {
    try {
        updateUserInMemory(user.id, user);
        revalidatePath('/admin', 'layout');
        revalidatePath('/admin/connect');
        revalidatePath('/explore');
        revalidatePath(`/profile/${user.id}`);
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function deleteUserAction(id: string): Promise<{ success: boolean }> {
    try {
        deleteUserInMemory(id);
        revalidatePath('/admin', 'layout');
        revalidatePath('/admin/connect');
        revalidatePath('/explore');
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function importUsersAction(newUsers: Omit<User, 'id'>[]): Promise<{ success: boolean; message: string }> {
    try {
        const count = importUsersInMemory(newUsers);
        revalidatePath('/admin', 'layout');
        revalidatePath('/admin/connect');
        revalidatePath('/explore');
        return { success: true, message: `${count} users imported successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: message };
    }
}
