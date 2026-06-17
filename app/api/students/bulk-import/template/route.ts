import { NextRequest, NextResponse } from "next/server";

// GET /api/students/bulk-import/template — download CSV template
export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const csvContent = `FULL_NAME,EMAIL,GENDER,CLASS_GRADE,CLASS_ARM,PHONE,PARENT_PHONE,ADDRESS,STATE_OF_ORIGIN,STUDENT_ID
Chinelo Okafor,chinelo.okafor@school.com,Female,JSS 1,A,09012345601,09012345678,123 Main St,Lagos,
Obinna Adeyemi,obinna.adeyemi@school.com,Male,JSS 2,B,09087654321,09087654320,456 Oak Ave,Ogun,
Zainab Hassan,zainab.hassan@school.com,Female,JSS 1,C,08123456789,08123456788,789 Pine Rd,Kano,
Tunde Oluwaseun,tunde.oluwaseun@school.com,Male,SS 1,A,08098765432,08098765431,321 Elm St,Oyo,`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students_template.csv"',
    },
  });
};
