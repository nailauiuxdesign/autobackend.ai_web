import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming a Button component exists or will be created

export default function Header() {
  return (
    <header className="sticky px-32 top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* You can use an SVG logo here or text */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="hidden font-bold sm:inline-block">
              Instant Backend
            </span>
          </Link>
          <div className='rounded-full text-xs'>
            v0.1
          </div>
        </div>
        {/* <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Link
              href="/settings"
              className="transition-colors hover:text-foreground/80 text-foreground/60 mr-4"
            >
              Settings
            </Link>
            <Button variant="default" size="sm">
              Sign In
            </Button>
          </nav>
        </div> */}
      </div>
    </header>
  );
}