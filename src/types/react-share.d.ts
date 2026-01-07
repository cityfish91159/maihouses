declare module "react-share" {
  import * as React from "react";

  export interface ShareButtonProps {
    url: string;
    title?: string;
    className?: string;
    children?: React.ReactNode;
    beforeOnClick?: () => void | Promise<void>;
    onShareWindowClose?: () => void;
    onClick?: (link?: string, event?: React.MouseEvent) => void;
  }

  export const LineShareButton: React.ComponentType<ShareButtonProps>;
}
