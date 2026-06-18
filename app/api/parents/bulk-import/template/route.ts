import { NextRequest, NextResponse } from "next/server";

// GET /api/parents/bulk-import/template — download CSV template
export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const csvContent = `FULL_NAME,EMAIL,PHONE,STUDENT_ADMISSION_NO,STUDENT_EMAIL,RELATIONSHIP
Mrs. Ngozi Okafor,ngozi.okafor@email.com,09012345678,SC-2026-0001,,Mother
Mr. Adeyemi Hassan,adeyemi.hassan@email.com,09087654321,SC-2026-0002,,Father
Mrs. Amara Oluwaseun,amara.oluwaseun@email.com,08123456789,SC-2026-0003,,Mother
Mr. Chinedu Nkosi,chinedu.nkosi@email.com,08098765432,SC-2026-0004,,Father
Dr. Folake Ajayi,,09156789012,SC-2026-0005,,Father
Ms. Tunde Obi,tunde.obi@email.com,,SC-2026-0006,,Mother`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="parents_template.csv"',
    },
  });
};

