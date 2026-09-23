import { AI_ASSISTANT_AVATAR_PATH, SAAS_NAME } from "@/lib/branding";
import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  size?: number;
  showName?: boolean;
  nameClassName?: string;
  className?: string;
};

export function BrandLogo({
  href = "/",
  size = 48,
  showName = true,
  nameClassName = "text-lg font-bold text-brand-600",
  className = "",
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src={AI_ASSISTANT_AVATAR_PATH}
        alt={SAAS_NAME}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-brand-200/80"
        style={{ width: size, height: size, minWidth: size }}
        priority
      />
      {showName && <span className={nameClassName}>{SAAS_NAME}</span>}
    </>
  );

  if (!href) {
    return <div className={`flex min-w-0 items-center gap-2 ${className}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`flex min-w-0 items-center gap-2 ${className}`}>
      {content}
    </Link>
  );
}
