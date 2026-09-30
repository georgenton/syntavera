"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function DocumentUploadForm({ projectId, documentId }: { projectId: string; documentId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const label = String(form.get("label") ?? "").trim();
    if (!(file instanceof File) || !file.size) {
      setMessage("Selecciona un archivo válido.");
      setPending(false);
      return;
    }
    try {
      const metadata = { projectId, originalName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, visibility: "CLIENT" as const };
      const signedResponse = await fetch("/api/files/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
      if (!signedResponse.ok) throw new Error("No se pudo autorizar la carga.");
      const signed = await signedResponse.json() as { storageKey: string; uploadUrl: string };
      const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": metadata.mimeType }, body: file });
      if (!uploadResponse.ok) throw new Error("El almacenamiento rechazó el archivo.");
      const completionResponse = await fetch("/api/files/complete-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...metadata, storageKey: signed.storageKey, documentId, label }) });
      if (!completionResponse.ok) throw new Error("No se pudo verificar la carga.");
      event.currentTarget.reset();
      setMessage("Versión verificada y registrada. Recarga para verla en el historial.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la carga.");
    } finally {
      setPending(false);
    }
  }

  return <form className="document-upload" onSubmit={submit}><div className="field"><label htmlFor={`file-${documentId}`}>Archivo</label><input id={`file-${documentId}`} name="file" type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt" required /></div><div className="field"><label htmlFor={`label-${documentId}`}>Etiqueta de versión</label><input id={`label-${documentId}`} name="label" maxLength={120} /></div><Button type="submit" variant="secondary" disabled={pending}>{pending ? "Verificando…" : "Subir nueva versión"}</Button>{message ? <p role="status" className="field-help">{message}</p> : null}</form>;
}
