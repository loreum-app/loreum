import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="text-lg font-bold">
              Loreum
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Structured worldbuilding for AI-assisted writing.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-foreground">
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  href="/worlds/star-wars"
                  className="hover:text-foreground"
                >
                  Demo World
                </Link>
              </li>
              <li>
                <Link href="/worlds" className="hover:text-foreground">
                  Explore Worlds
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/mcp" className="hover:text-foreground">
                  MCP Setup
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/migrate" className="hover:text-foreground">
                  Migrate
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-foreground">
                  Compare
                </Link>
              </li>
            </ul>
          </div>

          {/* Updates */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Updates</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/roadmap" className="hover:text-foreground">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/whats-new" className="hover:text-foreground">
                  What&apos;s New
                </Link>
              </li>
            </ul>

            <h3 className="mb-3 mt-6 text-sm font-medium">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/loreum-app/loreum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/loreum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Loreum. Open source under
            AGPL-3.0.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
