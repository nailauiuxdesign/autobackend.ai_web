import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Instant Backend Generator. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/documentation"
            className="text-sm font-medium hover:text-foreground/80 text-foreground/60"
          >
            Documentation
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium hover:text-foreground/80 text-foreground/60"
          >
            GitHub
          </Link>
          <Link
            href="/support"
            className="text-sm font-medium hover:text-foreground/80 text-foreground/60"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}