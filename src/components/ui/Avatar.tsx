interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover flex-shrink-0 ${sizes[size]} ${className}`}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold ${sizes[size]} ${className}`}
      style={{ background: '#009739', color: '#FEDD00' }}
    >
      {initials}
    </div>
  );
}
