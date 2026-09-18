"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@loreum/ui/dropdown-menu";
import {
  EditEntityTypeDialog,
  type EditableEntityType,
} from "@/components/dialogs/edit-entity-type-dialog";
import {
  Users,
  MapPin,
  Building2,
  Box,
  Network,
  Clock,
  ScrollText,
  Map,
  ChevronRight,
  Plus,
  Check,
  X,
  Settings,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Trash2,
} from "lucide-react";

interface ProjectSidebarProps {
  projectSlug: string;
  projectName: string;
}

type ItemType = EditableEntityType;

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
  const router = useRouter();
  const basePath = `/projects/${projectSlug}`;
  const { isMobile, setOpenMobile } = useSidebar();

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<ItemType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const [untypedCount, setUntypedCount] = useState(0);
  const [addTypeError, setAddTypeError] = useState<string | null>(null);

  useEffect(() => {
    api<ItemType[]>(`/projects/${projectSlug}/entity-types`)
      .then(setItemTypes)
      .catch(() => {});
  }, [projectSlug]);

  // Items with no custom type belong to no type's page, so the sidebar offers
  // a way in whenever any exist.
  useEffect(() => {
    api<unknown[]>(`/projects/${projectSlug}/entities?type=ITEM&itemType=none`)
      .then((items) => setUntypedCount(items.length))
      .catch(() => setUntypedCount(0));
  }, [projectSlug, pathname]);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleAddType = async () => {
    if (!newTypeName.trim() || submitting) return;
    setSubmitting(true);
    setAddTypeError(null);
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
    } catch (err) {
      // Swallowing this left the input sitting there with no explanation.
      setAddTypeError(
        err instanceof ApiError ? err.message : "Could not create the type",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isActive = (href: string) => {
    const fullPath = `${basePath}/${href}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const openEdit = (type: ItemType, confirmDelete = false) => {
    setEditingType(type);
    setPendingDelete(confirmDelete);
    setEditOpen(true);
  };

  const handleTypeUpdated = (previousSlug: string, updated: ItemType) => {
    setItemTypes((prev) =>
      prev
        .map((t) => (t.slug === previousSlug ? updated : t))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    const oldPath = `${basePath}/entities/${previousSlug}`;
    if (updated.slug !== previousSlug && pathname.startsWith(oldPath)) {
      router.replace(
        pathname.replace(oldPath, `${basePath}/entities/${updated.slug}`),
      );
    }
  };

  const handleTypeDeleted = (slug: string) => {
    setItemTypes((prev) => prev.filter((t) => t.slug !== slug));
    if (isActive(`entities/${slug}`)) router.replace(basePath);
  };

  // The primitive pins the sidebar to the whole viewport (inset-y-0 h-svh).
  // Here it sits below the site app bar (h-14), so it is nudged down and
  // shortened to match the workspace shell.
  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)]">
      {/* The collapse control lives in the workspace header, which stays put
          while content scrolls; a second one here was just a spare bar. */}
      <SidebarHeader>
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
                  <SidebarMenuItem key={it.id}>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuAction
                            showOnHover
                            aria-label={`${it.name} options`}
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(it)}>
                          <Pencil className="h-4 w-4" />
                          Rename or edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => openEdit(it, true)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
                {untypedCount > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("entities/items")}
                      render={
                        <Link
                          href={`${basePath}/entities/items`}
                          onClick={handleNavClick}
                        />
                      }
                    >
                      <PackageOpen className="h-4 w-4" />
                      Untyped items
                      <span className="ml-auto text-xs text-muted-foreground">
                        {untypedCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  {addingType ? (
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Input
                          value={newTypeName}
                          onChange={(e) => {
                            setNewTypeName(e.target.value);
                            setAddTypeError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddType();
                            if (e.key === "Escape") {
                              setAddingType(false);
                              setNewTypeName("");
                              setAddTypeError(null);
                            }
                          }}
                          placeholder="Type name..."
                          className="h-7 text-sm"
                          autoFocus
                          disabled={submitting}
                          aria-invalid={addTypeError !== null}
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
                            setAddTypeError(null);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {addTypeError && (
                        <p
                          role="alert"
                          className="mt-1 text-xs text-destructive"
                        >
                          {addTypeError}
                        </p>
                      )}
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
      {/* Outside SidebarContent so it stays reachable when the nav overflows. */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("settings")}
              render={
                <Link href={`${basePath}/settings`} onClick={handleNavClick} />
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <EditEntityTypeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        projectSlug={projectSlug}
        entityType={editingType}
        otherTypes={itemTypes.filter((t) => t.id !== editingType?.id)}
        startWithDelete={pendingDelete}
        onUpdated={handleTypeUpdated}
        onDeleted={handleTypeDeleted}
      />
    </Sidebar>
  );
}
