const VARIANTS = {
  primary: 'bg-gold text-white hover:brightness-95',
  outline: 'border border-navy/20 text-navy hover:bg-white',
  dark: 'bg-navy text-white hover:bg-[#1A2942]',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}