import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UagSummaryCard } from "../UagSummaryCard";
import { STRINGS } from "../../../constants/strings";

const mockData = {
  grade: "S",
  score: 92,
  growth: 15,
  tags: [],
};

describe("UagSummaryCard", () => {
  it("renders correct grade and growth", () => {
    render(
      <MemoryRouter>
        <UagSummaryCard data={mockData as any} />
      </MemoryRouter>,
    );

    expect(screen.getByText("S 2")).toBeInTheDocument(); // Logic: S => 2
    expect(screen.getByText(/近7日新增 15/)).toBeInTheDocument();
  });

  it("uses correct constants", () => {
    render(
      <MemoryRouter>
        <UagSummaryCard data={mockData as any} />
      </MemoryRouter>,
    );

    expect(screen.getByText(STRINGS.AGENT.UAG.TITLE)).toBeInTheDocument();
    expect(
      screen.getByText(STRINGS.AGENT.UAG.LINK_WORKBENCH),
    ).toBeInTheDocument();
  });
});
