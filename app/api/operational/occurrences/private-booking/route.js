import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  cancelPrivateBooking,
  createPrivateBooking,
} from '@/lib/operational/occurrenceService';
import {
  handleOperationalError,
  parseJsonBody,
  validationResponse,
} from '@/lib/operational/routeHelpers';
import {
  cancelBookingSchema,
  privateBookingSchema,
} from '@/lib/validations/operational';

export async function POST(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN', 'STUDENT']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = privateBookingSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const occurrence = await createPrivateBooking(parsed.data, user);
    return NextResponse.json({ data: occurrence }, { status: 201 });
  } catch (error) {
    return handleOperationalError(error, 'Booking Private');
  }
}

export async function DELETE(request) {
  const { user, response } = await requireApiUser(['SUPERADMIN', 'OWNER', 'ADMIN', 'STUDENT']);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = cancelBookingSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const occurrence = await cancelPrivateBooking(parsed.data.bookingId, user);
    return NextResponse.json({ data: occurrence });
  } catch (error) {
    return handleOperationalError(error, 'Booking Private');
  }
}
