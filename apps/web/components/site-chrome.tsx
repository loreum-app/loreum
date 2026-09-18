"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

/**
 * A project workspace is an app shell: full height, its own scroll area, and a
 * fixed sidebar. The marketing footer does not belong there — it sits in page
 * flow below the viewport, where the fixed sidebar overlaps it.
 */
function isWorkspace(pathname: string): boolean {
  return /^\/projects\/[^/]+(\/|$)/.test(pathname);
}

export function SiteChrome() {
  const pathname = usePathname();
  const workspace = isWorkspace(pathname);

  // The workspace scrolls inside its own pane, so the document itself must not
  // scroll as well; otherwise the app bar drags the whole page.
  useEffect(() => {
    document.body.classList.toggle("workspace-shell", workspace);
    return () => document.body.classList.remove("workspace-shell");
  }, [workspace]);

  if (workspace) return null;
  return <SiteFooter />;
}
