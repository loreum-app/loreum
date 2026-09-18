import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@loreum/types";
import { ApiError, api } from "@/lib/api";
import { CreateProjectDialog } from "./create-project-dialog";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function renderDialog() {
  const onCreated = vi.fn();
  render(
    <CreateProjectDialog open onOpenChange={() => {}} onCreated={onCreated} />,
  );
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Second World" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  return { onCreated };
}

describe("CreateProjectDialog", () => {
  beforeEach(() => {
    mockedApi.mockReset();
  });

  it("shows the server's own message when the API rejects the request", async () => {
    mockedApi.mockRejectedValueOnce(
      new ApiError(403, {}, "Your plan does not allow more projects."),
    );
    const { onCreated } = renderDialog();

    expect(
      await screen.findByText("Your plan does not allow more projects."),
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("falls back to a generic message for failures that carry no API message", async () => {
    mockedApi.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderDialog();

    expect(
      await screen.findByText("Failed to create project"),
    ).toBeInTheDocument();
  });

  it("hands the created project to the caller on success", async () => {
    const created: Project = {
      id: "p2",
      name: "Second World",
      slug: "second-world",
      description: null,
      visibility: "PRIVATE",
      ownerId: "u1",
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    };
    mockedApi.mockResolvedValueOnce(created);
    const { onCreated } = renderDialog();

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(mockedApi).toHaveBeenCalledWith("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Second World",
        description: undefined,
        visibility: "PRIVATE",
      }),
    });
  });
});
