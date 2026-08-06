'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChemicalType, Pool } from '@prisma/client';
import { createPool, updatePool } from '@/lib/actions/admin/pools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  contactName: z.string().optional(),
  chemicalType: z.nativeEnum(ChemicalType),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PoolFormProps {
  pool?: Pool;
  onSuccess: (pool: Pool) => void;
  onCancel: () => void;
}

export default function PoolForm({ pool, onSuccess, onCancel }: PoolFormProps) {
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pool?.name ?? '',
      address: pool?.address ?? '',
      contactName: pool?.contactName ?? '',
      chemicalType: pool?.chemicalType ?? ChemicalType.CHLORINE,
      notes: pool?.notes ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const saved = pool ? await updatePool(pool.id, values) : await createPool(values);
      onSuccess(saved);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. The Smiths" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact name</FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="chemicalType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chemical type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={ChemicalType.CHLORINE}>Chlorine</option>
                  <option value={ChemicalType.SALT}>Salt</option>
                </select>
              </FormControl>
              {!pool && (
                <p className="text-xs text-muted-foreground">
                  A default checklist for this chemical type will be created automatically.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Gate code, dog, anything worth remembering" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{pool ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Form>
  );
}
