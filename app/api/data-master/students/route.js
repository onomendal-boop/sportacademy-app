import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import {
  createStudent,
  getStudents,
} from '@/lib/data-master/studentService';
import { studentSchema } from '@/lib/validations/dataMaster';

export async function GET() {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN', 'COACH']);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getStudents(user) });
  } catch (error) {
    return handleDataMasterError(error, 'Siswa');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const student = await createStudent(parsed.data, user);
    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    return handleDataMasterError(error, 'Siswa');
  }
}
