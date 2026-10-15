const VARIANTS = {
  primary:
    'bg-[#E8D5FF] text-[#18181B] border border-[#18181B] shadow-[0_2px_0_0_#18181B] hover:bg-[#DFC2FF] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#18181B] active:translate-y-[2px] active:shadow-none',
  lilac:
    'bg-[#E8D5FF] text-[#18181B] border border-[#18181B] shadow-[0_2px_0_0_#18181B] hover:bg-[#DFC2FF] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#18181B] active:translate-y-[2px] active:shadow-none',
  dark:
    'bg-[#18181B] text-white border border-[#18181B] shadow-[0_2px_0_0_#000] hover:bg-[#27272A] hover:translate-y-[1px] active:translate-y-[2px]',
  outline:
    'bg-white/80 text-[#18181B] border border-[#18181B]/20 hover:border-[#18181B]/40 hover:bg-white',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}