import { useMutation } from '@tanstack/react-query';
import { submitEnquiry } from '../api/enquiries.js';
import type { EnquiryInput } from '../api/types.js';
import type { ApiError } from '../api/client.js';

export function useSubmitEnquiry() {
  return useMutation<{ status: string }, ApiError, EnquiryInput>({
    mutationFn: (data: EnquiryInput) => submitEnquiry(data),
  });
}
