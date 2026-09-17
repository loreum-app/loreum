"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
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
  PanelLeftClose,
  ChevronRight,
  Plus,
  Check,
  X,
  Settings,
  MoreHorizontal,
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
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<ItemType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

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

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive("settings")}
                render={
                  <Link
                    href={`${basePath}/settings`}
                    onClick={handleNavClick}
                  />
                }
              >
                <Settings className="h-4 w-4" />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
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
