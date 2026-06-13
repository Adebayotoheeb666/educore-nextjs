import { NextRequest, NextResponse } from "next/server";

// GET /api/teachers/bulk-import/template — download CSV template
export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const csvContent = `FULL_NAME,EMAIL,PHONE,ROLE,QUALIFICATIONS,SUBJECT_AREA
Chukwu Adeyemi,chukwu.adeyemi@school.com,09012345678,subject_teacher,B.Sc Mathematics,Mathematics
Abiola Oluwaseun,abiola.oluwaseun@school.com,09087654321,class_teacher,B.A Education,General Studies
Zainab Mohammed,zainab.mohammed@school.com,08123456789,subject_teacher,B.Ed English,English Language
Tunde Okafor,tunde.okafor@school.com,08098765432,subject_teacher,B.Sc Physics,Physics
Chioma Anyanwu,chioma.anyanwu@school.com,09156789012,class_teacher,B.A Education,Primary Education`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="teachers_template.csv"',
    },
  });
};
