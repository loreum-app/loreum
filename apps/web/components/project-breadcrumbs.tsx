"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@loreum/ui/breadcrumb";

const labelMap: Record<string, string> = {
  "entity-types": "Entity Types",
  entities: "Entities",
  relationships: "Relationships",
  timeline: "Timeline",
  lore: "Lore",
  storyboard: "Storyboard",
  tags: "Tags",
};

interface ProjectBreadcrumbsProps {
  projectName: string;
  projectSlug: string;
}

export function ProjectBreadcrumbs({
  projectName,
  projectSlug,
}: ProjectBreadcrumbsProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectSlug}`;

  // Get path segments after /projects/[slug]/
  const rest = pathname.slice(basePath.length).replace(/^\//, "");
  const segments = rest ? rest.split("/") : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length > 0 ? (
            <BreadcrumbLink render={<Link href={basePath} />}>
              {projectName}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{projectName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {segments.map((segment, i) => {
          const href = `${basePath}/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          const label =
            labelMap[segment] ||
            segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <span key={href} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
