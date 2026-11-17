import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import type { ReportUserInput } from '@/types/report.types';
import { USER_REPORTED } from '@repo/constants';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useReportUser(conversationId: string) {
  return useMutation<void, Error, ReportUserInput>({
    async mutationFn({ user, reason }) {
      await axiosInstance.post('/report', { conversationId, user, reason: reason.trim() });
    },
    onSuccess() {
      toast.success(USER_REPORTED);
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });
}
