
export interface AdminUserWithPassword {
    id: string;
    name: string;
    username: string;
    password: string;
    role: 'super-admin' | 'editor';
}

export type AdminUser = Omit<AdminUserWithPassword, 'password'>;

// In-memory cache for prototype. This pattern is more robust against HMR.
declare global {
  // eslint-disable-next-line no-var
  var __admin_users_cache__: AdminUserWithPassword[] | undefined;
}

if (!global.__admin_users_cache__) {
    global.__admin_users_cache__ = [
        {
            id: 'admin-1',
            name: 'Vasudha Admin',
            username: 'vasudhaadmin',
            password: '191203',
            role: 'super-admin',
        },
        {
            id: 'admin-2',
            name: 'Editor User',
            username: 'editor',
            password: '191203',
            role: 'editor',
        }
    ];
}

const adminUsers = global.__admin_users_cache__;


export const authenticateAdmin = async (username: string, passwordAttempt: string): Promise<AdminUserWithPassword | null> => {
    const user = adminUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return null;
    }

    const isMatch = passwordAttempt === user.password;
    if (isMatch) {
        return user;
    }

    return null;
};

export const getAdmins = async (): Promise<AdminUser[]> => {
    // Return a copy without passwords for security
    return adminUsers.map(({ password, ...user }) => user);
};

export const addAdmin = async (newAdminData: Omit<AdminUserWithPassword, 'id'>): Promise<AdminUserWithPassword> => {
    if (adminUsers.some(u => u.username.toLowerCase() === newAdminData.username.toLowerCase())) {
        throw new Error('Username already exists.');
    }
    
    if (!newAdminData.password) {
         throw new Error('Password is required.');
    }

    const newAdmin: AdminUserWithPassword = {
        id: `admin-${Date.now()}`,
        name: newAdminData.name,
        username: newAdminData.username,
        role: newAdminData.role,
        password: newAdminData.password,
    };
    
    adminUsers.push(newAdmin);
    return newAdmin;
};

export const deleteAdmin = async (idToDelete: string, currentAdminId: string): Promise<void> => {
    if (idToDelete === currentAdminId) {
        throw new Error('You cannot delete your own account.');
    }

    const adminToDelete = adminUsers.find(u => u.id === idToDelete);
    if (!adminToDelete) {
        throw new Error('Admin user not found.');
    }

    if (adminToDelete.role === 'super-admin') {
        const superAdminCount = adminUsers.filter(u => u.role === 'super-admin').length;
        if (superAdminCount <= 1) {
            throw new Error('You cannot delete the last super-admin account.');
        }
    }
    
    const indexToDelete = adminUsers.findIndex(u => u.id === idToDelete);
    if (indexToDelete > -1) {
        adminUsers.splice(indexToDelete, 1);
    }
};
