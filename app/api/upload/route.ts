import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { uploadFile } from "@/lib/services/cloudinary";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return badRequest("No file provided");
      if (!ALLOWED.includes(file.type)) return badRequest("File type not allowed");
      if (file.size > MAX_BYTES) return badRequest("File exceeds 5 MB limit");

      const folder = (formData.get("folder") as string) || `educore/${school?.id ?? "general"}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await uploadFile(buffer, {
        folder,
        resourceType: file.type === "application/pdf" ? "raw" : "image",
        transformation: file.type.startsWith("image/")
          ? [{ width: 1200, quality: "auto", fetch_format: "auto" }]
          : undefined,
      });

      return ok(result);
    } catch (err) {
      return serverError(err);
    }
  }
);
