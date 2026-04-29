import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type DocumentRouteContext = {
  params: {
    documentId: string;
  };
};

function sanitizeFileName(value: string) {
  return value.replace(/[^\w.\-() ]+/g, "_");
}

export async function GET(_request: Request, { params }: DocumentRouteContext) {
  const session = await requireUser();

  const document = await prisma.patientDocument.findUnique({
    where: { id: params.documentId },
    select: {
      id: true,
      userId: true,
      originalName: true,
      mimeType: true,
      fileData: true
    }
  });

  if (!document) {
    return new NextResponse("Documento no encontrado.", { status: 404 });
  }

  if (session.role !== UserRole.ADMIN && session.userId !== document.userId) {
    return new NextResponse("No autorizado.", { status: 403 });
  }

  return new NextResponse(Buffer.from(document.fileData), {
    status: 200,
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${sanitizeFileName(document.originalName)}"`,
      "Cache-Control": "private, no-store, max-age=0"
    }
  });
}
