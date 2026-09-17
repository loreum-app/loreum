import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@loreum/types";
import { ProjectProvider, useProject } from "./project-context";

const project: Project = {
  id: "p1",
  name: "Ember Coast",
  slug: "ember-coast",
  description: null,
  visibility: "PRIVATE",
  ownerId: "u1",
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-16T00:00:00.000Z",
};

describe("useProject", () => {
  it("returns the project and setter provided by the surrounding layout", () => {
    const setProject = vi.fn();
    const { result } = renderHook(() => useProject(), {
      wrapper: ({ children }) => (
        <ProjectProvider value={{ project, setProject }}>
          {children}
        </ProjectProvider>
      ),
    });

    expect(result.current.project).toBe(project);
    expect(result.current.setProject).toBe(setProject);
  });

  it("throws a descriptive error when used outside a project layout", () => {
    expect(() => renderHook(() => useProject())).toThrow(
      "useProject must be used within a project layout",
    );
  });
});
