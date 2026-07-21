"use client";

import { Shield, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { encryptString } from "@/lib/crypto";
import { ENVIRONMENTS, STATUSES, emptyForm, type NewKeyForm, type WorkspaceEnvelope, type WorkspaceRecord } from "@/lib/types";
import { Button, Field, IconButton, IconTile, SelectField, TextareaField } from "./ui";
import { capitalize } from "@/lib/helpers";

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
  const [form, setForm] = useState<NewKeyForm>(() => ({
    ...emptyForm,
    owner: workspace.meta.ownerEmail,
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, owner: workspace.meta.ownerEmail });
      setError("");
    }
  }, [open, workspace.meta.ownerEmail]);

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
        status: form.status,
        owner: form.owner.trim() || workspace.meta.ownerEmail,
        description: form.description.trim(),
        website: form.website.trim(),
        docsUrl: form.docsUrl.trim(),
        monthlyLimit: Number(form.monthlyLimit) || 0,
        monthlyCost: Number(form.monthlyCost) || 0,
        rotationIntervalDays: Number(form.rotationIntervalDays) || 90,
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
            <h2 id="add-key-title">Add New API Key</h2>
            <p>Secrets are encrypted in this browser before the ciphertext is saved to Neon.</p>
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
              <strong>Enhanced Security</strong>
              <span>Your API key is encrypted in this browser. Neon receives ciphertext, never the plaintext value.</span>
            </div>
          </div>

          <div className="form-grid">
            <Field id="service-name" label="Service Name" name="service" onChange={(event) => update("service", event.target.value)} placeholder="Service name" value={form.service} />
            <Field id="key-name" label="Key Name" name="keyName" onChange={(event) => update("name", event.target.value)} placeholder="Key name" value={form.name} />
            <Field autoComplete="off" id="api-key-value" label="API Key" name="apiKey" onChange={(event) => update("apiKey", event.target.value)} placeholder="Paste API key value" value={form.apiKey} wrapperClassName="full-field" />
            <SelectField id="key-environment" label="Environment" name="environment" onChange={(event) => update("environment", event.target.value)} value={form.environment}>
              {ENVIRONMENTS.map((item) => (<option key={item} value={item}>{item}</option>))}
            </SelectField>
            <SelectField id="key-status" label="Status" name="status" onChange={(event) => update("status", event.target.value)} value={form.status}>
              {STATUSES.map((item) => (<option key={item} value={item}>{capitalize(item)}</option>))}
            </SelectField>
            <Field id="key-owner" label="Owner" name="owner" onChange={(event) => update("owner", event.target.value)} placeholder="Owner" value={form.owner} />
            <Field id="rotation-interval" label="Rotation Interval" min="1" name="rotationIntervalDays" onChange={(event) => update("rotationIntervalDays", event.target.value)} type="number" value={form.rotationIntervalDays} />
            <Field id="service-website" label="Service Website" name="website" onChange={(event) => update("website", event.target.value)} placeholder="Service website" value={form.website} />
            <Field id="docs-url" label="API Docs URL" name="docsUrl" onChange={(event) => update("docsUrl", event.target.value)} placeholder="Documentation link" value={form.docsUrl} />
            <TextareaField className="full-field" id="key-description" label="Description" name="description" onChange={(event) => update("description", event.target.value)} placeholder="What is this key used for?" rows={3} value={form.description} />
            <Field id="monthly-limit" label="Monthly Request Limit" min="0" name="monthlyLimit" onChange={(event) => update("monthlyLimit", event.target.value)} placeholder="0" type="number" value={form.monthlyLimit} />
            <Field id="monthly-cost" label="Estimated Monthly Cost" min="0" name="monthlyCost" onChange={(event) => update("monthlyCost", event.target.value)} placeholder="0.00" step="0.01" type="number" value={form.monthlyCost} />
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
