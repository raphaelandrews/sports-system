import type { ReactNode } from "react";

export function NarrativeRichText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) {
      return;
    }

    blocks.push(
      <ul
        key={`list-${blocks.length}`}
        className="space-y-2 pl-5 text-sm leading-7 text-foreground/90"
      >
        {bulletBuffer.map((item, index) => (
          <li key={`${item}-${index}`} className="list-disc marker:text-primary">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>,
    );

    bulletBuffer = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      return;
    }

    flushBullets();

    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${blocks.length}`}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(4))}
        </h3>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(3))}
        </h2>,
      );
      return;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={`h1-${blocks.length}`}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(2))}
        </h1>,
      );
      return;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-7 text-foreground/85">
        {renderInlineMarkdown(line)}
      </p>,
    );
  });

  flushBullets();

  return <div className="space-y-4">{blocks}</div>;
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={`${part}-${index}`}
          className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-foreground"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
