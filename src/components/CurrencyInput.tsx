import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../services/calculations';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'R$ 0,00',
  disabled = false
}) => {
  const [displayVal, setDisplayVal] = useState<string>(formatCurrency(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayVal(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayVal(value ? value.toString().replace('.', ',') : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayVal(formatCurrency(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayVal(raw);

    // Extrai dígitos e vírgula/ponto para conversão numérica
    const cleanStr = raw.replace(/[^\d,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanStr);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <input
      type="text"
      value={displayVal}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-800 ${className}`}
    />
  );
};
