import { resolveKafkaEnabled } from './kafka.config';

describe('resolveKafkaEnabled', () => {
  it('mặc định BẬT khi biến không được set', () => {
    expect(resolveKafkaEnabled(undefined)).toBe(true);
  });

  it('mặc định BẬT khi biến rỗng (xử lý giống trường hợp không set)', () => {
    expect(resolveKafkaEnabled('')).toBe(true);
    expect(resolveKafkaEnabled('   ')).toBe(true);
  });

  it('BẬT với "true" (không phân biệt hoa/thường)', () => {
    expect(resolveKafkaEnabled('true')).toBe(true);
    expect(resolveKafkaEnabled('TRUE')).toBe(true);
    expect(resolveKafkaEnabled(' True ')).toBe(true);
  });

  it('TẮT với mọi giá trị khác "true"', () => {
    expect(resolveKafkaEnabled('false')).toBe(false);
    expect(resolveKafkaEnabled('FALSE')).toBe(false);
    expect(resolveKafkaEnabled('0')).toBe(false);
    expect(resolveKafkaEnabled('no')).toBe(false);
  });
});
