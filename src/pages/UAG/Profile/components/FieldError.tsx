import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  id: string;
  message: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ id, message }) => (
  <p id={id} role="alert" className="mt-1 inline-flex items-start gap-1.5 text-sm text-red-600">
    <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </p>
);
