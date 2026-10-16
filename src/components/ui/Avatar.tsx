import Image from 'next/image';

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  /** Shows a small green "online" dot. */
  online?: boolean;
  className?: string;
}

export function Avatar({ src, alt, size = 40, online, className = '' }: AvatarProps) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="size-full rounded-full object-cover"
      />
      {online != null && (
        <span
          aria-hidden
          className={`absolute bottom-0 end-0 block rounded-full border-2 border-card ${online ? 'bg-online' : 'bg-ink-2'}`}
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
        />
      )}
    </span>
  );
}
