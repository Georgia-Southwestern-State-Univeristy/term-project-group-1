import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CallPage from "../call/page";

const mockSession = {
  sessionId: "abc-123",
  status: "created",
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve(mockSession),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("CallPage", () => {
  it("renders the heading and start button", () => {
    render(<CallPage />);
    expect(
      screen.getByRole("heading", { name: "Call Session" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Session" })
    ).toBeInTheDocument();
  });

  it("does not show session info before starting", () => {
    render(<CallPage />);
    expect(screen.queryByText(/Session ID/)).not.toBeInTheDocument();
  });

  it("fetches and displays session info when button is clicked", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await user.click(screen.getByRole("button", { name: "Start Session" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/session", {
      method: "POST",
    });
    expect(await screen.findByText(/abc-123/)).toBeInTheDocument();
    expect(screen.getByText(/created/)).toBeInTheDocument();
  });
});
