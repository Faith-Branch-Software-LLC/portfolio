import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { UseFormReturn } from "react-hook-form";
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { Switch } from './switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';

interface GenericFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  description: string;
  placeholder?: string;
  defaultValue?: any;
  disabled?: boolean;
  type?: "text" | "number" | "email" | "phone" | "date" | "checkbox" | "select" | "radio" | "textarea" | "switch";
  prefix?: string;
  suffix?: string;
  options?: { value: string; label: string }[];
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: (value: any) => void;
  rows?: number;
  required?: boolean;
}

export default function GenericFormField({
  form,
  name,
  label,
  prefix,
  suffix,
  description,
  placeholder,
  defaultValue,
  type = "text",
  options = [],
  disabled = false,
  value,
  onChange,
  onBlur,
  required = false,
  rows = 3
}: GenericFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="my-1 font-gelasio">
          <FormLabel className="flex flex-row items-center font-fraunces text-md">
            {label} {required && <span className="text-backgroundRed">*</span>}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 ml-2" />
                </TooltipTrigger>
                <TooltipContent className="max-w-96 font-gelasio">{description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            {type === "switch" 
            ? (
              <Switch
                checked={value ?? field.value}
                defaultChecked={field.value ?? true}
                onCheckedChange={onChange ?? field.onChange}
                disabled={disabled}
                onBlur={onBlur ?? field.onBlur}
              />
            ) : type === "select" ? (
              <Select
                onValueChange={onChange ?? field.onChange}
                value={value ?? field.value ?? ""}
                disabled={disabled || options.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                value={value ?? field.value ?? ""}
                disabled={disabled}
                onChange={onChange ?? field.onChange}
                onBlur={onBlur ?? field.onBlur}
                name={field.name}
                ref={field.ref}
                rows={rows}
              />
            ) : (
              <Input
                placeholder={placeholder}
                value={value ?? field.value ?? ""}
                type={type}
                prefix={prefix}
                suffix={suffix}
                disabled={disabled}
                onChange={onChange ?? field.onChange}
                onBlur={onBlur ?? field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};