import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  id,
  type = 'text',
  placeholder = '',
  error = '',
  helperText = '',
  className = '',
  required = false,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-3.5'} py-2 text-sm bg-white dark:bg-navy-850 text-slate-900 dark:text-slate-100 border rounded-lg shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 dark:focus:border-electric-400 transition-colors ${
            error
              ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
              : 'border-slate-300 dark:border-navy-750'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
