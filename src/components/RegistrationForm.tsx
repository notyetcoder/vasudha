
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserSearch } from 'lucide-react';
import type { User } from '@/lib/data';
import { useState, useEffect, useRef, useMemo } from 'react';
import RelativeSelectionModal from './RelativeSelectionModal';
import { Button } from './ui/button';
import { createUser, getUsers } from '@/actions/users';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import ImageCropperModal from './ImageCropperModal';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];
const familyOptionsBySurname = {
  VARCHAND: [
    'DODHIYEVARA', 'GOKREVARA', 'KESRANI', 'PATEL', 'VARCHAND',
  ].sort(),
  MATA: [
    'BHANA RAMAIYA', 'DEVANI', 'DHANANI', 'JAGANI', 'KHENGAR', 'LADHANI',
    'RUPANI', 'SUJANI', 'TEJA TRIKAM', 'UKERANI', 'VAGHANI', 'VARJANG',
    'VIRANI', 'VISAMAN',
  ].sort(),
  CHHANGA: [
    'BHAGVANI', 'BHIMNAI', 'BHOJANI', 'DEHAR MANDA', 'GANGANI', 'NATHANI',
    'RATANI', 'SAMRANI', 'SAMTANI',
  ].sort(),
};
const surnameOptions = ['MATA', 'CHHANGA', 'VARCHAND', 'OTHER'];
const descriptionOptions = [
    'ANIMAL HUSBANDRY (PASUPALAN)',
    'ARTISAN / BHARATKAAM',
    'BUSINESS',
    'DAIRY BUSINESS',
    'FARMER',
    'FOOD MANUFACTURING',
    'GOVERNMENT JOB',
    'HARDWARE SHOP',
    'HOUSE WIFE',
    'LABOURER',
    'SERVICE',
    'STUDENT',
    'TEACHER',
    'TRANSPORTATION',
    'OTHER',
].sort();


const nameValidation = z.string().regex(/^[A-Z]+$/, { message: "Only uppercase letters are allowed, with no spaces." });

const optionalNameValidation = z.preprocess(
    (val) => (val === "" ? undefined : val),
    nameValidation.optional()
);

const formSchema = z.object({
  name: nameValidation.min(2, 'Name requires at least 2 characters.'),
  gender: z.enum(['male', 'female'], { required_error: 'Please select a gender.' }),
  maritalStatus: z.enum(['single', 'married'], { required_error: 'Please select a marital status.' }),
  family: z.string().optional(),
  
  maidenSurname: z.string().min(1, 'Please select a surname.'),
  maidenSurnameOther: optionalNameValidation,
  
  currentSurname: z.string().optional(),
  currentSurnameOther: optionalNameValidation,
  
  fatherName: nameValidation.min(2, "Father's name is required."),
  motherName: nameValidation.min(2, "Mother's name is required."),
  
  spouseName: optionalNameValidation,
  spouseFamily: z.string().optional(),

  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  
  description: z.string().optional(),
  otherDescription: z.string().optional(),
}).refine(data => {
    if (data.maidenSurname === 'OTHER') {
        return !!data.maidenSurnameOther && data.maidenSurnameOther.length > 0;
    }
    return true;
}, {
    message: "Please specify surname.",
    path: ['maidenSurnameOther'],
}).refine(data => {
    if (data.currentSurname === 'OTHER') {
        return !!data.currentSurnameOther && data.currentSurnameOther.length > 0;
    }
    return true;
}, {
    message: "Please specify surname.",
    path: ['currentSurnameOther'],
}).refine(data => {
    if (data.gender === 'female' && data.maritalStatus === 'married') {
        return !!data.currentSurname;
    }
    return true;
}, {
    message: "Current Surname is required for married women.",
    path: ['currentSurname'],
}).refine(data => {
    if (data.maritalStatus === 'married') {
        return !!data.spouseName && data.spouseName.length >= 2;
    }
    return true;
}, {
    message: "Spouse's name must be at least 2 characters.",
    path: ['spouseName'],
});


type FormData = z.infer<typeof formSchema>;
type SelectionType = 'father' | 'mother' | 'spouse';

const defaultFormValues: Partial<FormData> = {
    maidenSurname: undefined,
    maidenSurnameOther: '',
    currentSurname: undefined,
    currentSurnameOther: '',
    name: '',
    gender: undefined,
    maritalStatus: undefined,
    family: undefined,
    fatherName: '',
    motherName: '',
    spouseName: '',
    spouseFamily: undefined,
    birthMonth: undefined,
    birthYear: undefined,
    description: undefined,
    otherDescription: '',
};

export default function RegistrationForm() {
    const { toast } = useToast();
    const { handleSubmit, watch, reset, formState: { errors }, setValue, control } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues
    });
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectionType, setSelectionType] = useState<SelectionType | null>(null);

    const [fatherId, setFatherId] = useState<string | undefined>();
    const [motherId, setMotherId] = useState<string | undefined>();
    const [spouseId, setSpouseId] = useState<string | undefined>();
    
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FormData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);

    const maidenSurnameSelection = watch('maidenSurname');
    const [imageFile, setImageFile] = useState<File | null>(null);


    useEffect(() => {
        const fetchAndSetData = async () => {
            const users = await getUsers();
            setAllUsers(users); 
        };
        fetchAndSetData();
    }, []);

    useEffect(() => {
        // When the surname changes, reset the family selection
        setValue('family', undefined);
    }, [maidenSurnameSelection, setValue]);


    const allSurnamesInDb = useMemo(() => {
        const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
        const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
        return [...new Set([...maidenNames, ...currentSurnames])].sort((a,b) => b.length - a.length);
    }, [allUsers]);

    const parseFirstName = (fullName?: string) => {
        if (!fullName) return '';
        let potentialFirstName = fullName;
        for (const surname of allSurnamesInDb) {
            if (potentialFirstName.endsWith(surname)) {
                return potentialFirstName.substring(0, potentialFirstName.length - surname.length).trim();
            }
        }
        return potentialFirstName;
    };

    const getFinalValue = (selectValue?: string, otherValue?: string) => {
        return selectValue === 'OTHER' ? (otherValue || '') : (selectValue || '');
    };

    const confirmationDisplayName = useMemo(() => {
        if (!pendingData) return '';

        const finalMaidenName = getFinalValue(pendingData.maidenSurname, pendingData.maidenSurnameOther);
        
        if (pendingData.gender === 'female' && pendingData.maritalStatus === 'married') {
            const spouseFirstName = parseFirstName(pendingData.spouseName);
            const finalCurrentSurname = getFinalValue(pendingData.currentSurname, pendingData.currentSurnameOther);
            return `${pendingData.name} ${spouseFirstName} ${finalCurrentSurname}`;
        } else {
            const fatherFirstName = parseFirstName(pendingData.fatherName);
            return `${pendingData.name} ${fatherFirstName} ${finalMaidenName}`;
        }
    }, [pendingData, allSurnamesInDb, parseFirstName]);


    const gender = watch('gender');
    const maritalStatus = watch('maritalStatus');
    const description = watch('description');
    const currentSurnameSelection = watch('currentSurname');
    
    const isMarriedFemale = gender === 'female' && maritalStatus === 'married';
    const isMarriedMale = gender === 'male' && maritalStatus === 'married';

    const formatNameInput = (value: string) => {
        if (!value) return '';
        return value.toUpperCase().replace(/[^A-Z]/g, '');
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result as string);
                setIsCropperOpen(true);
            });
            reader.readAsDataURL(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const onCropComplete = (url: string) => {
        setCroppedImageUrl(url);
    };

    const handleFormSubmit = (data: FormData) => {
        setPendingData(data);
        setIsConfirmOpen(true);
        setHasAgreed(false);
    };
    
    const processSubmission = async () => {
        if (!pendingData) return;
        
        setIsProcessing(true);

        const finalMaidenName = getFinalValue(pendingData.maidenSurname, pendingData.maidenSurnameOther);
        let finalCurrentSurname = finalMaidenName;
        if (pendingData.gender === 'female' && pendingData.maritalStatus === 'married') {
            finalCurrentSurname = getFinalValue(pendingData.currentSurname, pendingData.currentSurnameOther) || finalMaidenName;
        }
        
        const finalDescription = pendingData.description === 'OTHER' ? pendingData.otherDescription : pendingData.description;

        const payload = {
            maidenName: finalMaidenName,
            surname: finalCurrentSurname,
            name: pendingData.name,
            gender: pendingData.gender,
            maritalStatus: pendingData.maritalStatus,
            fatherName: pendingData.fatherName,
            motherName: pendingData.motherName,
            family: pendingData.family,
            spouseName: pendingData.spouseName,
            birthMonth: pendingData.birthMonth,
            birthYear: pendingData.birthYear,
            description: finalDescription,
            fatherId,
            motherId,
            spouseId,
            profilePictureUrl: croppedImageUrl || undefined,
        };

        const result = await createUser(payload);
        
        if (result.success && result.userId) {
            toast({
                title: "Registration Submitted!",
                description: `Your profile is pending approval. Your Unique ID is: ${result.userId}`,
            });
            reset(defaultFormValues);
            setFatherId(undefined);
            setMotherId(undefined);
            setSpouseId(undefined);
            setCroppedImageUrl(null);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('users-updated'));
            }
        } else {
             toast({
                variant: 'destructive',
                title: "Submission Failed",
                description: result.message,
            });
        }
        
        setIsProcessing(false);
        setIsConfirmOpen(false);
        setPendingData(null);
    };

    const openSelectionModal = (type: SelectionType) => {
        setSelectionType(type);
        setIsModalOpen(true);
    };

    const handleSelectRelative = (relative: User) => {
        if (selectionType) {
            const fieldName = `${selectionType}Name` as 'fatherName' | 'motherName' | 'spouseName';
            const selectedName = `${relative.name}${relative.surname}`;
            setValue(fieldName, selectedName, { shouldValidate: true });

            if (selectionType === 'father') setFatherId(relative.id);
            if (selectionType === 'mother') setMotherId(relative.id);
            if (selectionType === 'spouse') {
                setSpouseId(relative.id);
                if (isMarriedFemale) {
                    setValue('family', relative.family, { shouldValidate: true });
                }
            }
            
            if ((selectionType === 'father' || selectionType === 'mother') && relative.spouseId) {
                const spouse = allUsers.find(u => u.id === relative.spouseId);
                if (spouse) {
                    const spouseFieldName = selectionType === 'father' ? 'motherName' : 'fatherName';
                    const spouseIdSetter = selectionType === 'father' ? setMotherId : setFatherId;
                    setValue(spouseFieldName, `${spouse.name}${spouse.surname}`, { shouldValidate: true });
                    spouseIdSetter(spouse.id);
                }
            }

            setIsModalOpen(false);
            setSelectionType(null);
        }
    };
    
    const handleManualSaveRelative = (name: string) => {
        if (selectionType) {
            const fieldName = `${selectionType}Name` as 'fatherName' | 'motherName' | 'spouseName';
            setValue(fieldName, name, { shouldValidate: true });
            
            if (selectionType === 'father') setFatherId(undefined);
            if (selectionType === 'mother') setMotherId(undefined);
            if (selectionType === 'spouse') setSpouseId(undefined);

            setIsModalOpen(false);
            setSelectionType(null);
        }
    };

    const getFilteredUsers = () => {
        if (!selectionType) return [];
        const sourceUsers = allUsers.filter(u => u.status === 'approved');
        switch (selectionType) {
            case 'father': return sourceUsers.filter(u => u.gender === 'male');
            case 'mother': return sourceUsers.filter(u => u.gender === 'female');
            case 'spouse':
                let potentialSpouses = sourceUsers.filter(u => !u.spouseId);
                if (gender === 'male') return potentialSpouses.filter(u => u.gender === 'female');
                if (gender === 'female') return potentialSpouses.filter(u => u.gender === 'male');
                return potentialSpouses;
            default: return [];
        }
    }

    const currentFamilyOptions = familyOptionsBySurname[maidenSurnameSelection as keyof typeof familyOptionsBySurname] || [];

    return (
        <>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label>Gender</Label>
                        <Controller
                            control={control}
                            name="gender"
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                    <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="male" /> Male</Label>
                                    <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="female" /> Female</Label>
                                </RadioGroup>
                            )}
                        />
                        {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label>Marital Status</Label>
                        <Controller
                            control={control}
                            name="maritalStatus"
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                   <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="single" /> Single</Label>
                                   <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="married" /> Married</Label>
                                </RadioGroup>
                            )}
                        />
                        {errors.maritalStatus && <p className="text-red-500 text-sm">{errors.maritalStatus.message}</p>}
                    </div>
                </div>

                {isMarriedFemale ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="maidenSurname">Surname (at birth)</Label>
                             <Controller name="maidenSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                            {errors.maidenSurname && <p className="text-red-500 text-sm">{errors.maidenSurname.message}</p>}
                            {maidenSurnameSelection === 'OTHER' && (
                                <div className="mt-2">
                                    <Controller name="maidenSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                    {errors.maidenSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.maidenSurnameOther.message}</p>}
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currentSurname">Current Surname (after marriage)</Label>
                             <Controller name="currentSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                            {errors.currentSurname && <p className="text-red-500 text-sm">{errors.currentSurname.message}</p>}
                            {currentSurnameSelection === 'OTHER' && (
                                <div className="mt-2">
                                    <Controller name="currentSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                    {errors.currentSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.currentSurnameOther.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                     <div className="grid gap-2">
                        <Label htmlFor="maidenSurname">Surname</Label>
                        <Controller name="maidenSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                         {errors.maidenSurname && <p className="text-red-500 text-sm">{errors.maidenSurname.message}</p>}
                         {maidenSurnameSelection === 'OTHER' && (
                            <div className="mt-2">
                                <Controller name="maidenSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                {errors.maidenSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.maidenSurnameOther.message}</p>}
                            </div>
                         )}
                    </div>
                )}
                
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="E.G. RAMESH" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="fatherName">Father's Name</Label>
                        <div className="flex gap-2">
                            <Controller name="fatherName" control={control} render={({ field }) => <Input {...field} placeholder="E.G. SURESH" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                             <Button type="button" variant="outline" size="icon" onClick={() => openSelectionModal('father')}><UserSearch /></Button>
                        </div>
                        {errors.fatherName && <p className="text-red-500 text-sm">{errors.fatherName.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="motherName">Mother's Name</Label>
                        <div className="flex gap-2">
                            <Controller name="motherName" control={control} render={({ field }) => <Input {...field} placeholder="E.G. ANITA" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                            <Button type="button" variant="outline" size="icon" onClick={() => openSelectionModal('mother')}><UserSearch /></Button>
                        </div>
                        {errors.motherName && <p className="text-red-500 text-sm">{errors.motherName.message}</p>}
                    </div>
                </div>
                
                {maritalStatus === 'married' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="spouseName">Spouse's Name</Label>
                            <div className="flex gap-2">
                                <Controller name="spouseName" control={control} render={({ field }) => <Input {...field} placeholder="E.G. RAMESHVARCHAND" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                <Button type="button" variant="outline" size="icon" onClick={() => openSelectionModal('spouse')} disabled={!gender}><UserSearch /></Button>
                            </div>
                            {!gender && <p className="text-blue-600 text-sm">Please select a gender to select a spouse.</p>}
                            {errors.spouseName && <p className="text-red-500 text-sm">{errors.spouseName.message}</p>}
                        </div>
                        {isMarriedMale && (
                            <div className="grid gap-2">
                                <Label htmlFor="spouseFamily">Spouse's Maiden Family</Label>
                                    <Controller
                                    name="spouseFamily"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="spouseFamily">
                                                <SelectValue placeholder="SELECT FAMILY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(familyOptionsBySurname).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="grid grid-cols-2 gap-2">
                         <div className="grid gap-2">
                            <Label htmlFor="birthMonth">Birth Month (Optional)</Label>
                            <Controller
                                control={control}
                                name="birthMonth"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="birthMonth"><SelectValue placeholder="MONTH" /></SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {errors.birthMonth && <p className="text-red-500 text-sm">{errors.birthMonth.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="birthYear">Birth Year (Optional)</Label>
                             <Controller
                                control={control}
                                name="birthYear"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="birthYear"><SelectValue placeholder="YEAR" /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {errors.birthYear && <p className="text-red-500 text-sm">{errors.birthYear.message}</p>}
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Profession (Optional)</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="description">
                                        <SelectValue placeholder="SELECT A PROFESSION" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {descriptionOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                         {description === 'OTHER' && (
                            <div className="mt-2">
                                <Controller
                                    name="otherDescription"
                                    control={control}
                                    render={({ field }) => <Input {...field} placeholder="Please specify your profession" />}
                                />
                                {errors.otherDescription && <p className="text-red-500 text-sm mt-1">{errors.otherDescription.message}</p>}
                            </div>
                         )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="grid gap-2">
                        <Label>Profile Picture (Optional)</Label>
                        <div className="flex items-center gap-4">
                            {croppedImageUrl ? (
                                <Image src={croppedImageUrl} alt="Profile preview" width={60} height={60} data-ai-hint="profile avatar" className="rounded-full" />
                            ) : (
                                <div className="w-[60px] h-[60px] rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <UserSearch />
                                </div>
                            )}
                            <Input
                                id="profilePicture"
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileChange}
                                accept="image/*"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Family (Optional)</Label>
                        <Controller
                            name="family"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!maidenSurnameSelection || maidenSurnameSelection === 'OTHER' || (isMarriedFemale && !!spouseId)}
                                >
                                    <SelectTrigger id="family">
                                        <SelectValue placeholder="SELECT FAMILY" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentFamilyOptions.length > 0 ? (
                                            currentFamilyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)
                                        ) : (
                                            <SelectItem value="disabled" disabled>First, select a valid surname</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.family && <p className="text-red-500 text-sm">{errors.family.message}</p>}
                    </div>
                </div>

                
                <div className="text-right">
                    <Button type="submit" disabled={isProcessing} size="lg">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Profile'}
                    </Button>
                </div>
            </form>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Profile Submission</DialogTitle>
                         <DialogDescription>
                            Please review your details and agree to the policy before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col items-center space-y-2">
                             <Image 
                                src={croppedImageUrl || 'https://placehold.co/150x150.png'} 
                                alt="Profile Preview" 
                                width={100} 
                                height={100} 
                                className="rounded-full border-2"
                                data-ai-hint="profile avatar"
                            />
                             <p className="text-lg font-bold">{confirmationDisplayName}</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Privacy and Policy</Label>
                            <ScrollArea className="h-32 w-full rounded-md border p-3 text-sm">
                                <p className="font-semibold mb-2">1. Data Accuracy and Approval:</p>
                                <p className="mb-2">You confirm that the information provided is accurate to the best of your knowledge. All profiles are subject to review and approval by an administrator. False or misleading entries may be rejected or removed without notice.</p>
                                
                                <p className="font-semibold mb-2">2. Public Visibility:</p>
                                <p className="mb-2">Once approved, your profile information, including your name, family connections, and profile picture, will be visible to other members of the community on this website. Do not submit information you wish to keep private.</p>

                                <p className="font-semibold mb-2">3. Data Usage:</p>
                                <p>The data collected is solely for the purpose of building and displaying the family tree for the Vasudha community. It will not be sold or shared with third parties for marketing purposes.</p>
                            </ScrollArea>
                        </div>
                        
                         <div className="flex items-center space-x-2">
                            <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(!!checked)} />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I have read and agree to the terms and policy.
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={processSubmission} disabled={isProcessing || !hasAgreed}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Agree & Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


             {isCropperOpen && (
                <ImageCropperModal
                    isOpen={isCropperOpen}
                    onClose={() => setIsCropperOpen(false)}
                    imageSrc={imageToCrop}
                    onCropComplete={onCropComplete}
                />
            )}
            {selectionType && (
                <RelativeSelectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    users={getFilteredUsers()}
                    allUsers={allUsers}
                    onSelect={handleSelectRelative}
                    onManualSave={handleManualSaveRelative}
                    title={`Select ${selectionType.charAt(0).toUpperCase() + selectionType.slice(1)}`}
                    selectionType={selectionType}
                />
            )}
        </>
    );
}
