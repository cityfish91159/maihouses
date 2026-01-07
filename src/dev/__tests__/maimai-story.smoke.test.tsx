import React from "react";
import { render, screen } from "@testing-library/react";
import { MaiMaiStoryApp } from "../maimai-story";

describe("MaiMaiStoryApp smoke", () => {
  it("renders controls and both MaiMai variants", () => {
    render(<MaiMaiStoryApp />);

    expect(screen.getByText("MaiMai 原子組件互動故事")).toBeInTheDocument();
    expect(screen.getByText("MaiMaiBase")).toBeInTheDocument();
    expect(screen.getByText("MascotInteractive")).toBeInTheDocument();

    // 控件存在（Mood select + textarea）
    expect(screen.getByLabelText("Mood")).toBeInTheDocument();
    expect(screen.getByLabelText("氣泡訊息 (每行一則)")).toBeInTheDocument();

    // 快速情境按鈕存在
    expect(screen.getByText("Success + Confetti")).toBeInTheDocument();
  });
});
