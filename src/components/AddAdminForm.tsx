'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createAdmin } from '@/actions/auth';

const formSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    role: z.enum(['super-admin', 'editor']),
});

type FormData = z.infer<typeof formSchema>;

export default function AddAdminForm({ onAdminAdded }: { onAdminAdded: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: 'editor',
        },
    });

    const onSubmit = async (values: FormData) => {
        setIsSubmitting(true);
        try {
            const result = await createAdmin(values);
            if (result.success) {
                toast({
                    title: "Admin Added",
                    description: result.message,
                });
                onAdminAdded();
            } else {
                 toast({ variant: "destructive", title: "Failed to Add Admin", description: result.message });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Failed to Add Admin", description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username')} />
                {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => control.setValue('role', value as 'super-admin' | 'editor')} defaultValue="editor">
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="super-admin">Super Admin</SelectItem>
                    </SelectContent>
                </Select>
                 {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-4">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin User
            </Button>
        </form>
    );
}
