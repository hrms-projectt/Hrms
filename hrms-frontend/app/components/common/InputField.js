"use client";

const controlClass =
  "w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function InputField({
  label,
  name,
  id = name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  hint = "",
  children,
  className = "",
  ...props
}) {
  const invalid = Boolean(error);
  const classes = `${controlClass} ${invalid ? "border-red-500/70" : "border-white/10"} ${className}`;

  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      {children ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={invalid}
          className={classes}
          {...props}
        >
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={`${classes} min-h-24 resize-y`}
          {...props}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={classes}
          {...props}
        />
      )}

      {error ? (
        <p className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
