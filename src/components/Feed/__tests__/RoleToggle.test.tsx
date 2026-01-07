import { render, screen, fireEvent } from "@testing-library/react";
import { RoleToggle } from "../../Feed/RoleToggle";
import { STRINGS } from "../../../constants/strings";

describe("RoleToggle Component", () => {
  it("renders correctly for Agent", () => {
    // Current role is Agent, toggle should say Switch to Member (Consumer)
    render(<RoleToggle currentRole="agent" onToggle={() => {}} />);

    // Check title tooltip
    expect(
      screen.getByTitle(STRINGS.AGENT.OOS.SWITCH_TO_CONSUMER),
    ).toBeInTheDocument();
    // Check displayed text
    expect(screen.getByText(STRINGS.AGENT.ROLE.AGENT)).toBeInTheDocument();
  });

  it("renders correctly for Member", () => {
    render(<RoleToggle currentRole="member" onToggle={() => {}} />);

    expect(
      screen.getByTitle(STRINGS.AGENT.OOS.SWITCH_TO_AGENT),
    ).toBeInTheDocument();
    expect(screen.getByText(STRINGS.AGENT.ROLE.CONSUMER)).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const mockToggle = vi.fn();
    render(<RoleToggle currentRole="agent" onToggle={mockToggle} />);

    fireEvent.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
