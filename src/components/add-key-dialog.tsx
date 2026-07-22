"use client";

import { Shield, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { encryptString } from "@/lib/crypto";
import { ENVIRONMENTS, emptyForm, type NewKeyForm, type WorkspaceEnvelope, type WorkspaceRecord } from "@/lib/types";
import { Button, Field, IconButton, IconTile, SelectField } from "./ui";
import { capitalize } from "@/lib/helpers";

const KNOWN_SERVICES = ["vercel", "neon", "openai", "github", "stripe", "anthropic", "aws", "supabase"];

export function AddKeyDialog({
  open,
  workspace,
  cryptoKey,
  onClose,
  onCreate,
}: {
  open: boolean;
  workspace: WorkspaceEnvelope;
  cryptoKey: CryptoKey;
  onClose: () => void;
  onCreate: (record: WorkspaceRecord) => Promise<void> | void;
}) {
  const [form, setForm] = useState<NewKeyForm>(() => ({ ...emptyForm }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm });
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof NewKeyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.service.trim() || !form.name.trim() || !form.apiKey.trim()) {
      setError("Service, key name, and API key are required.");
      return;
    }
    setBusy(true);
    try {
      const encrypted = await encryptString(cryptoKey, form.apiKey.trim());
      const now = new Date().toISOString();
      await onCreate({
        id: crypto.randomUUID(),
        service: form.service.trim(),
        name: form.name.trim(),
        environment: form.environment,
        status: "active",
        owner: workspace.meta.workspaceName,
        description: "",
        website: "",
        docsUrl: "",
        monthlyLimit: 0,
        monthlyCost: 0,
        rotationIntervalDays: 90,
        lastRotatedAt: now,
        createdAt: now,
        updatedAt: now,
        cipherText: encrypted.cipherText,
        iv: encrypted.iv,
      });
    } catch {
      setError("Could not encrypt this API key.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-key-title">
        <header className="dialog-header">
          <div>
            <h2 id="add-key-title">Add API Key</h2>
            <p>Encrypted here. We auto-create the Codex agent, policy, and MCP config.</p>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <form className="dialog-body" onSubmit={submit}>
          <div className="security-callout">
            <IconTile>
              <Shield size={18} />
            </IconTile>
            <div>
              <strong>One-step Codex setup</strong>
              <span>After save, Apiki creates the Codex agent + policy and gives you an MCP config. You only paste your passphrase.</span>
            </div>
          </div>

          <div className="form-grid">
            <SelectField id="service-name" label="Service" name="service" onChange={(event) => update("service", event.target.value)} value={form.service} required>
              <option value="">Select service...</option>
              {KNOWN_SERVICES.map((service) => (
                <option key={service} value={service}>{capitalize(service)}</option>
              ))}
            </SelectField>
            <Field id="key-name" label="Key Name" name="keyName" onChange={(event) => update("name", event.target.value)} placeholder="e.g. Personal GitHub" value={form.name} />
            <Field autoComplete="off" id="api-key-value" label="API Key" name="apiKey" onChange={(event) => update("apiKey", event.target.value)} placeholder="Paste API key" value={form.apiKey} wrapperClassName="full-field" />
            <SelectField id="key-environment" label="Environment" name="environment" onChange={(event) => update("environment", event.target.value)} value={form.environment}>
              {ENVIRONMENTS.map((item) => (<option key={item} value={item}>{item}</option>))}
            </SelectField>
          </div>

          {error ? <p className="dialog-error">{error}</p> : null}

          <div className="dialog-footer">
            <Button onClick={onClose} variant="secondary">Cancel</Button>
            <Button disabled={busy} type="submit" variant="primary">{busy ? "Encrypting..." : "Encrypt & Save"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
