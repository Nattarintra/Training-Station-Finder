import { checkInSchema, reservationSchema } from '@/src/features/bookings/schema';

describe('reservation validation', () => {
  it('accepts valid contact details and trims values', () => {
    const result = reservationSchema.parse({
      fullName: '  Alex Morgan  ',
      email: ' alex@example.com ',
      phone: '+46 70 123 45 67',
    });
    expect(result.fullName).toBe('Alex Morgan');
    expect(result.email).toBe('alex@example.com');
  });

  it('rejects a one-character name', () => {
    const result = reservationSchema.safeParse({
      fullName: 'A',
      email: 'a@b.com',
      phone: '0701234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed email and phone values', () => {
    const result = reservationSchema.safeParse({
      fullName: 'Alex Morgan',
      email: 'alex@',
      phone: 'abc',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toHaveLength(2);
  });

  it('normalizes a valid check-in code', () => {
    expect(checkInSchema.parse({ bookingCode: ' tsf-abc123 ' }).bookingCode).toBe(
      'TSF-ABC123',
    );
  });
});
