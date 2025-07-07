
import { format } from 'date-fns';

export interface User {
    id: string;
    surname: string; // Current surname
    maidenName: string; // Surname at birth
    name: string;
    family: string; // The primary family group (MATA, CHHANGA, VARCHAND)
    gender: 'male' | 'female';
    maritalStatus: 'single' | 'married';
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    // The string names are now used for unlinked relatives pending admin connection
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    birthMonth?: string;
    birthYear?: string;
    profilePictureUrl: string;
    description: string;
    status: 'pending' | 'approved';
  }
  
// In-memory cache for prototype. This pattern is more robust against HMR.
declare global {
  // eslint-disable-next-line no-var
  var __users_cache__: User[] | undefined;
}
  
if (!global.__users_cache__) {
    global.__users_cache__ = [
      // Generation 1
      {
        id: 'VAR-240725-001',
        surname: 'VARCHAND',
        maidenName: 'VARCHAND',
        name: 'ARJANBHAI',
        family: 'VARCHAND',
        gender: 'male',
        maritalStatus: 'married',
        fatherName: 'VERABHAI',
        motherName: 'BADHIBEN',
        spouseId: 'JAD-240725-001',
        spouseName: 'RATIBENVARCHAND',
        birthMonth: 'SEPTEMBER',
        birthYear: '1950',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'farmer and hard work',
        status: 'approved'
      },
      {
        id: 'JAD-240725-001',
        surname: 'VARCHAND',
        maidenName: 'JADEJA',
        name: 'RATIBEN',
        family: 'VARCHAND',
        gender: 'female',
        maritalStatus: 'married',
        fatherName: 'BIJALBHAI',
        motherName: 'RANIBA',
        spouseId: 'VAR-240725-001',
        spouseName: 'ARJANBHAIVARCHAND',
        birthMonth: 'JANUARY',
        birthYear: '1965',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'home maker',
        status: 'approved'
      },
      // Generation 2
      {
        id: 'VAR-240725-002',
        surname: 'VARCHAND',
        maidenName: 'VARCHAND',
        name: 'VALJIBHAI',
        family: 'VARCHAND',
        gender: 'male',
        maritalStatus: 'married',
        fatherId: 'VAR-240725-001',
        fatherName: 'ARJANBHAIVARCHAND',
        motherId: 'JAD-240725-001',
        motherName: 'RATIBENVARCHAND',
        spouseId: 'PAR-240725-001',
        spouseName: 'BHAKTIBENVARCHAND',
        birthMonth: 'APRIL',
        birthYear: '1990',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'home maker',
        status: 'approved'
      },
      {
        id: 'PAR-240725-001',
        surname: 'VARCHAND',
        maidenName: 'PARMAR',
        name: 'BHAKTIBEN',
        family: 'VARCHAND',
        gender: 'female',
        maritalStatus: 'married',
        fatherName: 'JIVABHAI',
        motherName: 'PARMABEN',
        spouseId: 'VAR-240725-002',
        spouseName: 'VALJIBHAIVARCHAND',
        birthMonth: 'MAY',
        birthYear: '1995',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: '',
        status: 'approved'
      },
      // Generation 3
      {
        id: 'VAR-240725-003',
        surname: 'VARCHAND',
        maidenName: 'VARCHAND',
        name: 'NANDLAL',
        family: 'VARCHAND',
        gender: 'male',
        maritalStatus: 'married',
        fatherId: 'VAR-240725-002',
        fatherName: 'VALJIBHAIVARCHAND',
        motherId: 'PAR-240725-001',
        motherName: 'BHAKTIBENVARCHAND',
        spouseId: 'MAK-240725-001',
        spouseName: 'MAYAVARCHAND',
        birthMonth: 'NOVEMBER',
        birthYear: '1998',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'admin',
        status: 'approved'
      },
      {
        id: 'VAR-240725-004',
        surname: 'VARCHAND',
        maidenName: 'VARCHAND',
        name: 'NISHANT',
        family: 'VARCHAND',
        gender: 'male',
        maritalStatus: 'married',
        fatherId: 'VAR-240725-002',
        fatherName: 'VALJIBHAIVARCHAND',
        motherId: 'PAR-240725-001',
        motherName: 'BHAKTIBENVARCHAND',
        spouseName: 'BANSI',
        birthMonth: 'MAY',
        birthYear: '2006',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'farmeer',
        status: 'approved'
      },
      {
        id: 'MAK-240725-001',
        surname: 'VARCHAND',
        maidenName: 'MAKWANA',
        name: 'MAYA',
        family: 'VARCHAND',
        gender: 'female',
        maritalStatus: 'married',
        fatherName: 'BALVANTBHAI',
        motherName: 'GOMTIBEN',
        spouseId: 'VAR-240725-003',
        spouseName: 'NANDLALVARCHAND',
        birthMonth: 'OCTOBER',
        birthYear: '2011',
        profilePictureUrl: 'https://placehold.co/150x150.png',
        description: 'wife',
        status: 'approved'
      }
    ];
}
  
export const users: User[] = global.__users_cache__;

const generateUniqueId = (surname: string): string => {
    const d = new Date();
    const datePart = format(d, 'ddMMyy');
    const familyPart = (surname || 'UNK').substring(0, 3).toUpperCase();
    const idPrefix = `${familyPart}-${datePart}`;
    
    const todaysUsers = users.filter(u => u.id.startsWith(idPrefix));
    
    let maxSequence = 0;
    todaysUsers.forEach(user => {
        const sequenceStr = user.id.split('-')[2];
        if (sequenceStr) {
            const sequence = parseInt(sequenceStr, 10);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        }
    });

    const newSequence = maxSequence + 1;
    const sequencePart = String(newSequence).padStart(3, '0');

    return `${idPrefix}-${sequencePart}`;
};


// Functions to manipulate the users array in-memory for the prototype
export const addUser = (userData: Omit<User, 'id' | 'status' >) => {
    const newUser: User = {
        surname: userData.surname,
        maidenName: userData.maidenName,
        name: userData.name,
        gender: userData.gender,
        maritalStatus: userData.maritalStatus,
        id: generateUniqueId(userData.surname),
        status: 'pending',
        family: userData.family || '',
        description: userData.description || '',
        fatherName: userData.fatherName || '',
        motherName: userData.motherName || '',
        spouseName: userData.spouseName || '',
        birthMonth: userData.birthMonth || '',
        birthYear: userData.birthYear || '',
        profilePictureUrl: userData.profilePictureUrl || 'https://placehold.co/150x150.png',
        fatherId: userData.fatherId,
        motherId: userData.motherId,
        spouseId: userData.spouseId,
    };
    
    users.unshift(newUser);

    if (newUser.spouseId) {
        const spouse = findUserById(newUser.spouseId, users);
        if (spouse) {
            spouse.spouseId = newUser.id;
            spouse.spouseName = `${newUser.name}${newUser.surname}`;
            spouse.maritalStatus = 'married';
        }
    }

    return newUser;
};

export const approveUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
        user.status = 'approved';
    }
};

export const deleteUser = (id: string) => {
    const index = users.findIndex(u => u.id === id);
    if (index > -1) {
        users.splice(index, 1);
    }
};

export const updateUser = (id: string, updatedData: Partial<User>) => {
    const user = findUserById(id, users);
    if (!user) return;

    const oldSpouseId = user.spouseId;
    const newSpouseId = updatedData.spouseId;

    if (newSpouseId !== oldSpouseId) {
        if (oldSpouseId) {
            const oldSpouse = findUserById(oldSpouseId, users);
            if (oldSpouse) {
                oldSpouse.spouseId = undefined;
                oldSpouse.spouseName = undefined;
                oldSpouse.maritalStatus = 'single';
            }
        }
        if (newSpouseId) {
            const newSpouse = findUserById(newSpouseId, users);
            if (newSpouse) {
                if (newSpouse.spouseId) {
                    const newSpousesOldPartner = findUserById(newSpouse.spouseId, users);
                    if (newSpousesOldPartner) {
                        newSpousesOldPartner.spouseId = undefined;
                        newSpousesOldPartner.spouseName = undefined;
                        newSpousesOldPartner.maritalStatus = 'single';
                    }
                }
                newSpouse.spouseId = id;
                newSpouse.spouseName = `${user.name}${user.surname}`;
                newSpouse.maritalStatus = 'married';
            }
        }
    }

    Object.assign(user, updatedData);

    if ('spouseId' in updatedData && !updatedData.spouseId) {
      user.maritalStatus = 'single';
    }
};

export const importUsers = (newUsers: Omit<User, 'id'>[]): number => {
    const usersToImport: User[] = newUsers.map(u => ({
        ...u,
        id: generateUniqueId(u.surname),
        status: 'approved',
        profilePictureUrl: u.profilePictureUrl || 'https://placehold.co/150x150.png',
    }));

    users.push(...usersToImport);
    return usersToImport.length;
};

// New helper functions
export const findUserById = (id: string | undefined, allUsers: User[]): User | undefined => {
    if (!id) return undefined;
    return allUsers.find(u => u.id === id);
}

export const findUserByName = (name: string | undefined, allUsers: User[]): User | undefined => {
    if (!name) return undefined;
    return allUsers.find(u => `${u.name}${u.surname}`.toLowerCase() === name.toLowerCase() && u.status === 'approved');
};

export const findChildren = (parent: User, allUsers: User[]): User[] => {
    if (!parent) return [];
    return allUsers.filter(u => 
        (u.fatherId === parent.id || u.motherId === parent.id)
    );
};

export const findSiblings = (user: User, allUsers: User[]): User[] => {
    if (!user || (!user.fatherId && !user.motherId)) return [];
    return allUsers.filter(u =>
        u.id !== user.id &&
        (
            (user.fatherId && u.fatherId === user.fatherId) || 
            (user.motherId && u.motherId === user.motherId)
        )
    );
};

export const findParents = (user: User, allUsers: User[]): { father?: User, mother?: User } => {
    if (!user) return {};
    const father = findUserById(user.fatherId, allUsers);
    const mother = findUserById(user.motherId, allUsers);
    return { father, mother };
}

export const findGrandparents = (user: User, allUsers: User[]): { paternalGrandfather?: User, paternalGrandmother?: User, maternalGrandfather?: User, maternalGrandmother?: User } => {
    if (!user) return {};
    const { father, mother } = findParents(user, allUsers);
    const paternalGrandfather = father ? findUserById(father.fatherId, allUsers) : undefined;
    const paternalGrandmother = father ? findUserById(father.motherId, allUsers) : undefined;
    const maternalGrandfather = mother ? findUserById(mother.fatherId, allUsers) : undefined;
    const maternalGrandmother = mother ? findUserById(mother.motherId, allUsers) : undefined;
    return { paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother };
}
