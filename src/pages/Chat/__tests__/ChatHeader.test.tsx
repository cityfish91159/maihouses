import { render, screen } from "@testing-library/react";
import { ChatHeader } from "../ChatHeader";

describe("ChatHeader", () => {
  it("renders loading skeleton", () => {
    const { container } = render(<ChatHeader isLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders counterpart and property info", () => {
    render(
      <ChatHeader
        counterpartName="王小明"
        counterpartSubtitle="agent@maihouses.com"
        statusLabel="對話中"
        propertyTitle="惠宇上晴"
        propertySubtitle="台中市西屯區"
      />,
    );
    expect(screen.getByText("王小明")).toBeInTheDocument();
    expect(screen.getByText("惠宇上晴")).toBeInTheDocument();
  });

  it("renders status label", () => {
    render(<ChatHeader counterpartName="王小明" statusLabel="等待回覆" />);
    expect(screen.getByText("等待回覆")).toBeInTheDocument();
  });
});
