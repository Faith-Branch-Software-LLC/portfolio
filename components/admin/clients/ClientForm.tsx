'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client } from '@prisma/client';
import { createClient, updateClient } from '@/lib/actions/admin/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? '',
      color: client?.color ?? '#888888',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      if (client) {
        await updateClient(client.id, values);
      } else {
        await createClient(values);
      }
      onSuccess();
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
                <Input placeholder="Client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={field.value ?? '#888888'}
                    onChange={field.onChange}
                    className="w-10 h-10 rounded cursor-pointer border border-input"
                  />
                  <Input placeholder="#888888" {...field} value={field.value ?? ''} className="font-mono" />
                </div>
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
          <Button type="submit">{client ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Form>
  );
}
