import React from "react";

export interface Source {
  title: string;
  url: string;
}

export function SourceList(props: { sources: Source[] }) {
  if (!props.sources || props.sources.length === 0) return null;

  return (
    <div className={"mt-4 pt-4 border-t border-border"}>
      <div className={"text-sm font-semibold mb-2 text-foreground"}>
        Sources
      </div>
      <div className={"flex flex-col gap-1"}>
        {props.sources.map((source, idx) => (
          <div key={idx} className={"text-xs text-muted-foreground"}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={source.title}
              className={
                "hover:text-primary hover:underline transition-colors block truncate"
              }
            >
              {idx + 1}. {source.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
