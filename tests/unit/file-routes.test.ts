import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  requireProjectAccess: vi.fn(),
  requirePermission: vi.fn(),
  createPrivateUploadUrl: vi.fn(),
  confirmPrivateUpload: vi.fn(),
  createPrivateDownloadUrl: vi.fn(),
  getPublishedSnapshot: vi.fn(),
  fileFindUnique: vi.fn(),
  documentFindFirst: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/modules/auth/guards", () => {
  class AuthorizationError extends Error {
    constructor(public readonly status: 401 | 403 | 404, message: string) {
      super(message);
      this.name = "AuthorizationError";
    }
  }
  return {
    AuthorizationError,
    requireCurrentUser: mocks.requireCurrentUser,
    requireProjectAccess: mocks.requireProjectAccess,
    requirePermission: mocks.requirePermission,
  };
});
vi.mock("@/modules/storage/service", () => ({
  createPrivateUploadUrl: mocks.createPrivateUploadUrl,
  confirmPrivateUpload: mocks.confirmPrivateUpload,
  createPrivateDownloadUrl: mocks.createPrivateDownloadUrl,
}));
vi.mock("@/modules/publication/service", () => ({ getPublishedSnapshot: mocks.getPublishedSnapshot }));
vi.mock("@/lib/db", () => ({
  prisma: {
    fileObject: { findUnique: mocks.fileFindUnique },
    document: { findFirst: mocks.documentFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/modules/audit/service", () => ({ writeAuditLog: vi.fn() }));

import { AuthorizationError } from "@/modules/auth/guards";
import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
import { POST as requestUpload } from "@/app/api/files/upload-url/route";
import { POST as completeUpload } from "@/app/api/files/complete-upload/route";
import { StorageValidationError } from "@/modules/storage/upload-policy";

const projectId = "00000000-0000-4000-8000-000000000001";
const fileId = "00000000-0000-4000-8000-000000000002";
const documentId = "00000000-0000-4000-8000-000000000003";

const uploadBody = {
  projectId,
  originalName: "evidence.pdf",
  mimeType: "application/pdf",
  sizeBytes: 100,
  visibility: "CLIENT",
};

function post(body: unknown) {
  return new Request("http://localhost/api/files", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("private file route boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({ user: { id: "user", kind: "CLIENT" } });
    mocks.requireProjectAccess.mockResolvedValue({ user: { id: "user", kind: "CLIENT" }, membership: { permissions: ["VIEW", "COMMENT"] } });
    mocks.requirePermission.mockResolvedValue({ user: { id: "user", kind: "CLIENT" } });
    mocks.createPrivateUploadUrl.mockResolvedValue({ storageKey: `projects/${projectId}/2026/key.pdf`, url: "https://storage.example.test/upload", expiresIn: 300 });
    mocks.createPrivateDownloadUrl.mockResolvedValue("https://storage.example.test/download");
    mocks.fileFindUnique.mockResolvedValue({ id: fileId, projectId, visibility: "CLIENT", storageKey: `projects/${projectId}/2026/key.pdf`, originalName: "evidence.pdf" });
  });

  it("returns 400 for malformed upload input", async () => {
    const response = await requestUpload(post({ projectId, mimeType: "application/pdf" }));
    expect(response.status).toBe(400);
    expect(mocks.requireProjectAccess).not.toHaveBeenCalled();
  });

  it("returns 401 without a session and 403 without COMMENT", async () => {
    mocks.requireProjectAccess.mockRejectedValueOnce(new AuthorizationError(401, "Authentication required"));
    expect((await requestUpload(post(uploadBody))).status).toBe(401);

    mocks.requireProjectAccess.mockResolvedValueOnce({ user: { id: "user", kind: "CLIENT" }, membership: { permissions: ["VIEW"] } });
    mocks.requirePermission.mockRejectedValueOnce(new AuthorizationError(403, "Permission COMMENT required"));
    expect((await requestUpload(post(uploadBody))).status).toBe(403);
    expect(mocks.createPrivateUploadUrl).not.toHaveBeenCalled();
  });

  it("maps invalid object metadata to 400 but does not hide infrastructure errors", async () => {
    mocks.createPrivateUploadUrl.mockRejectedValueOnce(new StorageValidationError("Unsupported file type"));
    expect((await requestUpload(post(uploadBody))).status).toBe(400);

    const infrastructureFailure = new Error("storage unavailable");
    mocks.createPrivateUploadUrl.mockRejectedValueOnce(infrastructureFailure);
    await expect(requestUpload(post(uploadBody))).rejects.toBe(infrastructureFailure);
  });

  it("conceals cross-project, internal, and unpublished files from clients", async () => {
    mocks.requireProjectAccess.mockRejectedValueOnce(new AuthorizationError(403, "Project access denied"));
    expect((await downloadFile(new Request("http://localhost"), { params: Promise.resolve({ id: fileId }) })).status).toBe(404);

    mocks.fileFindUnique.mockResolvedValueOnce({ id: fileId, projectId, visibility: "INTERNAL", storageKey: "internal", originalName: "secret.pdf" });
    expect((await downloadFile(new Request("http://localhost"), { params: Promise.resolve({ id: fileId }) })).status).toBe(404);

    mocks.getPublishedSnapshot.mockResolvedValueOnce({ snapshot: { deliverables: [] } });
    expect((await downloadFile(new Request("http://localhost"), { params: Promise.resolve({ id: fileId }) })).status).toBe(404);
    expect(mocks.createPrivateDownloadUrl).not.toHaveBeenCalled();
  });

  it("redirects only when the client file is in the current snapshot", async () => {
    mocks.getPublishedSnapshot.mockResolvedValueOnce({ snapshot: { deliverables: [{ documents: [{ versions: [{ file: { id: fileId } }] }] }] } });
    const response = await downloadFile(new Request("http://localhost"), { params: Promise.resolve({ id: fileId }) });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://storage.example.test/download");
  });

  it("rejects a document from another project before inspecting object storage", async () => {
    mocks.requireProjectAccess.mockResolvedValueOnce({ user: { id: "internal", kind: "INTERNAL" }, membership: null });
    mocks.documentFindFirst.mockResolvedValueOnce(null);
    const response = await completeUpload(post({ ...uploadBody, storageKey: `projects/${projectId}/2026/key.pdf`, documentId }));
    expect(response.status).toBe(404);
    expect(mocks.confirmPrivateUpload).not.toHaveBeenCalled();
  });
});
