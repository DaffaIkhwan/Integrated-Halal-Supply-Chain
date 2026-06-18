"use client";

import React, { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkdownTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!tableRef.current) return;
    
    // Parse the table into TSV (Tab Separated Values) so it copies nicely into Excel/Sheets
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    const tsv = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        return cells.map((cell) => cell.textContent?.trim() || "").join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group my-6 border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs flex gap-1.5 shadow-sm bg-background/80 backdrop-blur-sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-sm text-left border-collapse" {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export const tableComponents = {
  table: MarkdownTable,
  thead({ className, children, ...props }: any) {
    return <thead className="bg-muted text-muted-foreground uppercase text-xs" {...props}>{children}</thead>;
  },
  th({ className, children, ...props }: any) {
    return <th className="px-4 py-3 border-b border-r last:border-r-0 font-semibold whitespace-nowrap" {...props}>{children}</th>;
  },
  td({ className, children, ...props }: any) {
    return <td className="px-4 py-3 border-b border-r last:border-r-0" {...props}>{children}</td>;
  },
  tr({ className, children, ...props }: any) {
    return <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>;
  },
};
