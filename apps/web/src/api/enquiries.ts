import { apiClient } from './client.js';
import type { EnquiryInput } from './types.js';

export async function submitEnquiry(
  input: EnquiryInput,
): Promise<{ status: string }> {
  return apiClient<{ status: string }>('/enquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
