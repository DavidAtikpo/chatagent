import { SAAS_LOGO_PATH, SAAS_NAME } from "@/lib/branding";
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
        src={SAAS_LOGO_PATH}
        alt={SAAS_NAME}
        width={size}
        height={size}
        className="shrink-0 rounded-lg object-contain"
        style={{ width: size, height: size, minWidth: size }}
        priority
      />
      {showName && <span className={nameClassName}>{SAAS_NAME}</span>}
    </>
  );

  if (!href) {
    return <div className={`flex items-center gap-3 ${className}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`flex items-center gap-3 ${className}`}>
      {content}
    </Link>
  );
}
