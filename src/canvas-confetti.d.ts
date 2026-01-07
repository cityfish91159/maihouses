declare module "canvas-confetti" {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: Array<"square" | "circle">;
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export interface CreateOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  function confetti(options?: Options): Promise<null> | null;

  namespace confetti {
    export interface CreateTypes {
      (options?: Options): Promise<null> | null;
      reset(): void;
    }

    function create(
      canvas: HTMLCanvasElement | null,
      options?: CreateOptions,
    ): CreateTypes;
    function reset(): void;
  }

  export default confetti;
}
