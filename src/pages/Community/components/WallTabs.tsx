import React from "react";
import { cn } from "../../../lib/utils";
import { WallTab } from "../types";

interface WallTabsProps {
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  className?: string;
}

export const WallTabs: React.FC<WallTabsProps> = ({
  currentTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn("flex border-b border-gray-200 mb-4", className)}>
      <button
        onClick={() => onTabChange("public")}
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors relative",
          currentTab === "public"
            ? "text-brand-600"
            : "text-gray-500 hover:text-gray-700",
        )}
      >
        公開牆
        {currentTab === "public" && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-600" />
        )}
      </button>
      <button
        onClick={() => onTabChange("private")}
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors relative",
          currentTab === "private"
            ? "text-brand-600"
            : "text-gray-500 hover:text-gray-700",
        )}
      >
        住戶牆
        {currentTab === "private" && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-600" />
        )}
      </button>
    </div>
  );
};
