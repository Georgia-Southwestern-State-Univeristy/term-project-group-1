import { render, screen } from "@testing-library/react";
import Page from "../page";

describe("Home Page", () => {
  it("renders the page", () => {
    render(<Page />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
