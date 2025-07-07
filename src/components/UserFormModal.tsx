
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ImageCropperModal from './ImageCropperModal';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const nameValidation = z.string().min(1).regex(/^[A-Z]+$/, 'Only uppercase letters allowed, no spaces.');

const formSchema = z.object({
  maidenName: nameValidation,
  surname: nameValidation,
  name: nameValidation.min(2, 'Name must be at least 2 characters.'),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married']),
  fatherName: nameValidation.min(2, "Father's name is required."),
  motherName: nameValidation.min(2, "Mother's name is required."),
  spouseName: nameValidation.optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  description: z.string().max(100, 'Description is too long.').optional(),
}).refine(data => {
    if (data.maritalStatus === 'married') {
        return !!data.spouseName && data.spouseName.length >=2;
    }
    return true;
}, {
    message: "Spouse's name is required for married status.",
    path: ['spouseName'],
});

type FormData = z.infer<typeof formSchema>;

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSave: (data: any) => void; // Can be User or FormData
  mode: 'create' | 'edit';
  prefillData?: Partial<User>;
};

const emptyFormValues = {
    surname: '',
    maidenName: '',
    name: '',
    gender: 'male' as 'male' | 'female',
    maritalStatus: 'single' as 'single' | 'married',
    fatherName: '',
    motherName: '',
    spouseName: '',
    birthMonth: '',
    birthYear: '',
    description: '',
};

export default function UserFormModal({ isOpen, onClose, user, onSave, mode, prefillData }: UserFormModalProps) {
    const { control, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && user) {
                reset({
                    ...user,
                    spouseName: user.spouseName || '',
                    description: user.description || '',
                });
                setCurrentImageUrl(user.profilePictureUrl);
            } else if (mode === 'create') {
                 reset({
                    ...emptyFormValues,
                    ...prefillData,
                    maidenName: prefillData?.surname || '', // Prefill maidenName with surname
                    surname: prefillData?.surname || '',
                });
                setCurrentImageUrl(null);
            }
            setCroppedImageUrl(null);
        }
    }, [isOpen, mode, user, prefillData, reset]);

    const maritalStatus = watch('maritalStatus');
    const gender = watch('gender');
    const isMarriedFemale = gender === 'female' && maritalStatus === 'married';

    const formatNameInput = (value: string) => value.toUpperCase().replace(/[^A-Z]/g, '');

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

    const handleRemovePicture = () => {
        setCurrentImageUrl(null);
        setCroppedImageUrl(null);
    };

    const onSubmit = async (values: FormData) => {
        const finalProfilePictureUrl = croppedImageUrl || currentImageUrl || 'https://placehold.co/150x150.png';

        const dataToSave = mode === 'edit' && user
            ? { ...user, ...values, profilePictureUrl: finalProfilePictureUrl }
            : { ...values, profilePictureUrl: finalProfilePictureUrl };

        onSave(dataToSave);
    };

    const nameInput = (name: keyof FormData, placeholder?: string) => (
        <Controller
            name={name}
            control={control}
            defaultValue=""
            render={({ field }) => (
                <Input
                    {...field}
                    placeholder={placeholder}
                    onChange={(e) => field.onChange(formatNameInput(e.target.value))}
                />
            )}
        />
    );

    const pictureToDisplay = croppedImageUrl || currentImageUrl;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? `Edit User: ${user?.name} ${user?.surname}` : 'Create New Person'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? "Make changes to the user's profile information. Click save when you're done." : "Fill in the details for the new person. They will be added as 'approved'."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                    {mode === 'edit' && user && (
                        <div className="grid gap-2">
                            <Label htmlFor="uniqueId">Unique ID</Label>
                            <Input id="uniqueId" value={user.id} readOnly disabled />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            {nameInput('name')}
                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="maidenName">Maiden Surname</Label>
                            {nameInput('maidenName')}
                            {errors.maidenName && <p className="text-red-500 text-sm">{errors.maidenName.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Gender</Label>
                            <Controller
                                control={control}
                                name="gender"
                                render={({ field }) => (
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex gap-4 pt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="male" id="male" />
                                            <Label htmlFor="male">Male</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="female" id="female" />
                                            <Label htmlFor="female">Female</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Marital Status</Label>
                             <Controller
                                control={control}
                                name="maritalStatus"
                                render={({ field }) => (
                                     <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex gap-4 pt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="single" id="single" />
                                            <Label htmlFor="single">Single</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="married" id="married" />
                                            <Label htmlFor="married">Married</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                    </div>

                    {isMarriedFemale && (
                         <div className="grid gap-2">
                            <Label htmlFor="surname">Current Surname</Label>
                            {nameInput('surname')}
                            {errors.surname && <p className="text-red-500 text-sm">{errors.surname.message}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="fatherName">Father's Name</Label>
                            {nameInput('fatherName')}
                            {errors.fatherName && <p className="text-red-500 text-sm">{errors.fatherName.message}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="motherName">Mother's Name</Label>
                            {nameInput('motherName')}
                            {errors.motherName && <p className="text-red-500 text-sm">{errors.motherName.message}</p>}
                        </div>
                    </div>

                    {maritalStatus === 'married' && (
                         <div className="grid gap-2">
                            <Label htmlFor="spouseName">Spouse's Name</Label>
                            {nameInput('spouseName')}
                            {errors.spouseName && <p className="text-red-500 text-sm">{errors.spouseName.message}</p>}
                        </div>
                    )}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Birth Month</Label>
                            <Controller
                                name="birthMonth"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.birthMonth && <p className="text-red-500 text-sm">{errors.birthMonth.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Birth Year</Label>
                            <Controller
                                name="birthYear"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.birthYear && <p className="text-red-500 text-sm">{errors.birthYear.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Controller
                                name="description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <Input {...field} />
                                )}
                            />
                            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-2">
                                {pictureToDisplay && pictureToDisplay !== 'https://placehold.co/150x150.png' ? (
                                    <>
                                        <Image src={pictureToDisplay} alt="Profile" width={40} height={40} className="rounded-full" />
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change</Button>
                                        <Button type="button" variant="destructive" size="sm" onClick={handleRemovePicture}>Remove</Button>
                                    </>
                                ) : (
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                                )}
                                <Input
                                    id="profilePicture"
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={onFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'edit' ? 'Save Changes' : 'Create Person'}
                        </Button>
                    </DialogFooter>
                </form>
                {isCropperOpen && (
                    <ImageCropperModal
                        isOpen={isCropperOpen}
                        onClose={() => setIsCropperOpen(false)}
                        imageSrc={imageToCrop}
                        onCropComplete={onCropComplete}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
