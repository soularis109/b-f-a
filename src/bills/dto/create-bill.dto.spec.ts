import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBillDto } from './create-bill.dto.js';

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateBillDto, payload);
  return validate(dto);
}

describe('CreateBillDto', () => {
  it('has no errors for a valid payload', async () => {
    const errors = await validateDto({ amount: 100, payee: 'Acme' });

    expect(errors).toHaveLength(0);
  });

  it.each([0, -1, -0.01])(
    'rejects a non-positive amount (%s)',
    async (amount) => {
      const errors = await validateDto({ amount, payee: 'Acme' });

      expect(errors.map((error) => error.property)).toContain('amount');
    },
  );

  it('rejects a non-numeric amount', async () => {
    const errors = await validateDto({ amount: 'ten', payee: 'Acme' });

    expect(errors.map((error) => error.property)).toContain('amount');
  });

  it('rejects an empty payee', async () => {
    const errors = await validateDto({ amount: 100, payee: '' });

    expect(errors.map((error) => error.property)).toContain('payee');
  });

  it('rejects a missing payee', async () => {
    const errors = await validateDto({ amount: 100 });

    expect(errors.map((error) => error.property)).toContain('payee');
  });
});
