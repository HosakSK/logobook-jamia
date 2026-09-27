import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "symbol";
  mode?: "dark" | "light";
  className?: string;
  href?: string;
  priority?: boolean;
}

export function Logo({
  variant = "full",
  mode = "dark",
  className,
  href,
  priority = false,
}: LogoProps) {
  const isDark = mode === "dark";

  let src = "/logo/logo-width-dark.svg";
  let width = 160;
  let height = 36;
  let alt = "Logobook.sk";

  if (variant === "symbol") {
    src = isDark ? "/logo/logo-symbol-dark.svg" : "/logo/logo-symbol-light.svg";
    width = 36;
    height = 36;
    alt = "Logobook.sk Symbol";
  } else {
    src = isDark ? "/logo/logo-width-dark.svg" : "/logo/logo-width-light.svg";
    width = 160;
    height = 36;
  }

  const content = (
    <div className={cn("inline-flex items-center select-none", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-contain transition-opacity duration-200",
          variant === "symbol" ? "h-8 w-8" : "h-7 w-auto"
        )}
        priority={priority}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
