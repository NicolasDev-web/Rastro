'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks({ items }: { items: [string, string][] }) {
  const path = usePathname();
  return <>{items.map(([href, title]) => {
    const active = path === href || path.startsWith(`${href}/`);
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined}>{title}</Link>;
  })}</>;
}
