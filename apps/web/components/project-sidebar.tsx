"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@loreum/ui/sidebar";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@loreum/ui/collapsible";
import {
  Users,
  MapPin,
  Building2,
  Box,
  Network,
  Clock,
  ScrollText,
  Map,
  PanelLeftClose,
  ChevronRight,
  Plus,
  Check,
  X,
} from "lucide-react";

interface ProjectSidebarProps {
  projectSlug: string;
  projectName: string;
}

interface ItemType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

const builtInTypes = [
  { icon: Users, label: "Characters", href: "entities/characters" },
  { icon: MapPin, label: "Locations", href: "entities/locations" },
  { icon: Building2, label: "Organizations", href: "entities/organizations" },
];

const otherNav = [
  { icon: Network, label: "Relationships", href: "relationships" },
  { icon: Clock, label: "Timeline", href: "timeline" },
  { icon: ScrollText, label: "Lore", href: "lore" },
  { icon: Map, label: "Storyboard", href: "storyboard" },
];

export function ProjectSidebar({
  projectSlug,
  projectName,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectSlug}`;
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<ItemType[]>(`/projects/${projectSlug}/entity-types`)
      .then(setItemTypes)
      .catch(() => {});
  }, [projectSlug]);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleAddType = async () => {
    if (!newTypeName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await api<ItemType>(
        `/projects/${projectSlug}/entity-types`,
        {
          method: "POST",
          body: JSON.stringify({ name: newTypeName.trim() }),
        },
      );
      setItemTypes((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewTypeName("");
      setAddingType(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const isActive = (href: string) => {
    const fullPath = `${basePath}/${href}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="pt-14">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={basePath} onClick={handleNavClick} />}
              className="font-semibold"
            >
              {projectName}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Entities group with collapsible */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/entities">
            <SidebarGroupLabel
              render={
                <CollapsibleTrigger className="flex w-full items-center justify-between" />
              }
            >
              Entities
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/entities:rotate-90" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                {builtInTypes.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      render={
                        <Link
                          href={`${basePath}/${item.href}`}
                          onClick={handleNavClick}
                        />
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {itemTypes.map((it) => (
                  <SidebarMenuItem key={it.slug}>
                    <SidebarMenuButton
                      isActive={isActive(`entities/${it.slug}`)}
                      render={
                        <Link
                          href={`${basePath}/entities/${it.slug}`}
                          onClick={handleNavClick}
                        />
                      }
                    >
                      <Box className="h-4 w-4" />
                      {it.name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  {addingType ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Input
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddType();
                          if (e.key === "Escape") {
                            setAddingType(false);
                            setNewTypeName("");
                          }
                        }}
                        placeholder="Type name..."
                        className="h-7 text-sm"
                        autoFocus
                        disabled={submitting}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={handleAddType}
                        disabled={!newTypeName.trim() || submitting}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingType(false);
                          setNewTypeName("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <SidebarMenuButton onClick={() => setAddingType(true)}>
                      <Plus className="h-4 w-4" />
                      Add new type
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Other nav */}
        <SidebarGroup>
          <SidebarGroupLabel>World</SidebarGroupLabel>
          <SidebarMenu>
            {otherNav.map((item) => {
              const fullPath = `${basePath}/${item.href}`;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={
                      pathname === fullPath ||
                      pathname.startsWith(`${fullPath}/`)
                    }
                    render={<Link href={fullPath} onClick={handleNavClick} />}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
