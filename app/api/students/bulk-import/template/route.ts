import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";

// GET /api/students/bulk-import/template — download CSV template
export const GET = withAuth(
  async (_req: NextRequest): Promise<NextResponse> => {
    const csvContent = `FULL_NAME,EMAIL,GENDER,CLASS_GRADE,PARENT_PHONE,STUDENT_ID
Chinelo Okafor,chinelo.okafor@school.com,Female,JSS 1,09012345678,
Obinna Adeyemi,obinna.adeyemi@school.com,Male,JSS 2,09087654321,
Zainab Hassan,zainab.hassan@school.com,Female,JSS 1,08123456789,
Tunde Oluwaseun,tunde.oluwaseun@school.com,Male,SS 1,08098765432,`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="students_template.csv"',
      },
    });
  },
  ["principal", "admin_staff", "school_owner"]
);
