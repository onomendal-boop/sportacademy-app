import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleDataMasterError,
  parseJsonBody,
  validationResponse,
} from '@/lib/data-master/routeHelpers';
import {
  deleteStudent,
  updateStudent,
} from '@/lib/data-master/studentService';
import { studentSchema } from '@/lib/validations/dataMaster';

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN']);
  if (response) return response;

  const { id } = await params;
  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const student = await updateStudent(id, parsed.data, user);
    return NextResponse.json({ data: student });
  } catch (error) {
    return handleDataMasterError(error, 'Siswa');
  }
}

export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER']);
  if (response) return response;

  const { id } = await params;

  try {
    return NextResponse.json(await deleteStudent(id, user));
  } catch (error) {
    return handleDataMasterError(error, 'Siswa');
  }
}
