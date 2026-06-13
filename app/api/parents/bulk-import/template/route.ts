import { NextRequest, NextResponse } from "next/server";

// GET /api/parents/bulk-import/template — download CSV template
export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const csvContent = `FULL_NAME,EMAIL,PHONE,STUDENT_EMAIL,RELATIONSHIP
Mrs. Ngozi Okafor,ngozi.okafor@email.com,09012345678,obinna.adeyemi@school.com,Mother
Mr. Adeyemi Hassan,adeyemi.hassan@email.com,09087654321,zainab.hassan@school.com,Father
Mrs. Amara Oluwaseun,amara.oluwaseun@email.com,08123456789,tunde.oluwaseun@school.com,Mother
Mr. Chinedu Nkosi,chinedu.nkosi@email.com,08098765432,ada.nkosi@school.com,Father
Dr. Folake Ajayi,folake.ajayi@email.com,09156789012,kadet.ajayi@school.com,Father`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="parents_template.csv"',
    },
  });
};
