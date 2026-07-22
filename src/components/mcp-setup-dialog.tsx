"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import type { McpSetupResult } from "@/lib/mcp-setup";
import { Button, IconButton } from "./ui";

export function McpSetupDialog({
  setup,
  onClose,
}: {
  setup: McpSetupResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(setup.mcpJson);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="mcp-setup-title">
        <header className="dialog-header">
          <div>
            <h2 id="mcp-setup-title">Codex MCP ready</h2>
            <p>
              Key saved for <strong>{setup.service}</strong>. Codex agent + policy were set up automatically.
            </p>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="dialog-body">
          <ol className="plain-steps">
            <li>Copy the MCP config below.</li>
            <li>Paste it into your Codex MCP settings.</li>
            <li>Replace <code>PASTE_YOUR_PASSPHRASE</code> with your workspace passphrase.</li>
          </ol>

          <div className="code-block mcp-config-block">
            <code>{setup.mcpJson}</code>
          </div>

          <div className="dialog-footer">
            <Button onClick={onClose} variant="secondary">Done</Button>
            <Button icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy} variant="primary">
              {copied ? "Copied" : "Copy MCP config"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
