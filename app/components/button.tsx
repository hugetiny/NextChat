import * as React from "react";
import { CSSProperties } from "react";
import { Button, ButtonProps } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

export type ButtonType = "primary" | "danger" | null;

export function IconButton(props: {
  onClick?: () => void;
  icon?: JSX.Element;
  type?: ButtonType;
  text?: string;
  bordered?: boolean;
  shadow?: boolean;
  className?: string;
  title?: string;
  disabled?: boolean;
  tabIndex?: number;
  autoFocus?: boolean;
  style?: CSSProperties;
  aria?: string;
}) {
  const mapTypeToVariant = (
    type: ButtonType,
    bordered?: boolean,
  ): ButtonProps["variant"] => {
    if (type === "danger") return "destructive";
    if (type === "primary") return "default";
    if (bordered) return "outline";
    return "secondary";
  };

  const variant = mapTypeToVariant(props.type ?? null, props.bordered);

  return (
    <Button
      variant={variant}
      className={cn(
        "flex items-center justify-center gap-2 transition-all duration-300",
        props.shadow && "shadow-md",
        props.className,
      )}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      tabIndex={props.tabIndex}
      autoFocus={props.autoFocus}
      style={props.style}
      aria-label={props.aria || props.text || props.title}
    >
      {props.icon && (
        <div
          aria-label={props.text || props.title}
          className={cn("flex items-center justify-center", {
            "text-white": props.type === "primary",
          })}
        >
          {props.icon}
        </div>
      )}

      {props.text && (
        <div
          aria-label={props.text || props.title}
          className="text-xs overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {props.text}
        </div>
      )}
    </Button>
  );
}
