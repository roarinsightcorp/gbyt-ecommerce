
import type { HTMLAttributes, ReactNode } from "react";

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  /**
   * Controls the transparency of the glass surface.
   */
  intensity?: "soft" | "medium" | "strong";

  /**
   * Adds a subtle brand-colored glow.
   */
  glow?: boolean;

  /**
   * Enables the interactive hover movement.
   */
  hover?: boolean;

  /**
   * Enables the animated light sweep across the surface.
   */
  animated?: boolean;
}

const intensityClasses = {
  soft: [
    "bg-white/45",
    "dark:bg-slate-950/45",
  ],

  medium: [
    "bg-white/65",
    "dark:bg-slate-950/65",
  ],

  strong: [
    "bg-white/80",
    "dark:bg-slate-950/80",
  ],
};

export function Glass({
  children,
  intensity = "medium",
  glow = true,
  hover = true,
  animated = true,
  className = "",
  ...props
}: GlassProps) {
  return (
    <div
      className={[
        /* -------------------------------------------------
           POSITIONING
        ------------------------------------------------- */

        "relative",
        "isolate",
        "overflow-hidden",

        /* -------------------------------------------------
           GLASS SURFACE
        ------------------------------------------------- */

        "backdrop-blur-xl",
        "backdrop-saturate-150",

        ...intensityClasses[intensity],

        /* -------------------------------------------------
           BORDER
        ------------------------------------------------- */

        "border",
        "border-white/60",
        "dark:border-white/[0.08]",

        /* -------------------------------------------------
           SHAPE
        ------------------------------------------------- */

        "rounded-2xl",

        /* -------------------------------------------------
           BASE SHADOW
        ------------------------------------------------- */

        "shadow-[0_8px_32px_rgba(8,126,164,0.08)]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.30)]",

        /* -------------------------------------------------
           MOTION
        ------------------------------------------------- */

        "transform-gpu",
        "transition-all",
        "duration-500",
        "ease-[cubic-bezier(0.22,1,0.36,1)]",

        /* -------------------------------------------------
           HOVER
        ------------------------------------------------- */

        hover && [
          "hover:-translate-y-1",
          "hover:border-primary/25",
          "hover:shadow-[0_18px_45px_rgba(8,126,164,0.14)]",
          "dark:hover:border-primary/20",
          "dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.40)]",
        ],

        /* -------------------------------------------------
           GLOW
        ------------------------------------------------- */

        glow && [
          "before:absolute",
          "before:-inset-24",
          "before:-z-10",
          "before:rounded-full",
          "before:bg-[radial-gradient(circle,rgba(57,213,242,0.14),transparent_65%)]",
          "before:opacity-60",
          "before:blur-2xl",
          "before:transition-opacity",
          "before:duration-700",

          hover && "hover:before:opacity-100",
        ],

        /* -------------------------------------------------
           ANIMATED LIGHT SWEEP
        ------------------------------------------------- */

        animated && [
          "after:absolute",
          "after:inset-y-0",
          "after:-left-[120%]",
          "after:w-[70%]",
          "after:-skew-x-12",

          "after:bg-gradient-to-r",
          "after:from-transparent",
          "after:via-white/20",
          "after:to-transparent",

          "after:transition-transform",
          "after:duration-[1200ms]",
          "after:ease-out",

          hover && "hover:after:translate-x-[320%]",

          "dark:after:via-white/[0.06]",
        ],

        className,
      ]
        .filter(Boolean)
        .flat()
        .join(" ")}
      {...props}
    >
      {/* -------------------------------------------------
          CONTENT
      ------------------------------------------------- */}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

