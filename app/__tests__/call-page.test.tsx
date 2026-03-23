import { render, screen } from "@testing-library/react";
import CallPage from "../call/page";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("CallPage", () => {
  it("renders the heading and start button", () => {
    render(<CallPage />);
    expect(
      screen.getByRole("heading", { name: "Start Call Session" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Session" })
    ).toBeInTheDocument();
  });

  it("renders policy selector", () => {
    render(<CallPage />);
    expect(screen.getByText("Select Policy")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("disables start button when no policy selected", () => {
    render(<CallPage />);
    expect(
      screen.getByRole("button", { name: "Start Session" })
    ).toBeDisabled();
  });

  it("fetches policies on mount", () => {
    render(<CallPage />);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/policies",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
