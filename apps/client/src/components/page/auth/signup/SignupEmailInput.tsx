import useDebounce from '@/components/hooks/useDebounce';
import Loading from '@/components/svg/Loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '@/lib/axios-instance';
import { cn } from '@/lib/utils';
import { CheckUserDataType, EmailStatus } from '@repo/enums';
import { SignUpFieldProps } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
export default function SignupEmailInput({ formData, setFormData }: SignUpFieldProps) {
  const debouncedEmailValue = useDebounce(formData.email, 1000);
  
  const { data: emailCheck, isLoading } = useQuery<EmailStatus>({
    enabled: Boolean(debouncedEmailValue),
    queryKey: ['signup', 'form', 'email', 'check', debouncedEmailValue],
    async queryFn() {
      const { data } = await axiosInstance.get(`/user/check/${CheckUserDataType.EMAIL}/${debouncedEmailValue}`);
      return data.data;
    },
  });

  return (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <div className="grid gap-1">
        <div className="relative">
          <Input
            type="email"
            required
            id="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className={cn(
              emailCheck === EmailStatus.AVAILABLE && 'border-green-500 border-2 focus-visible:ring-green-500',
              emailCheck === EmailStatus.ALREADY_USED && 'border-destructive border-2 focus-visible:ring-destructive',
            )}
          />
          {isLoading && (
            <Loading
              data-testid="email-input-loading"
              className="h-5 w-auto absolute top-1/2 -translate-y-1/2 right-2"
            />
          )}
          {emailCheck === EmailStatus.AVAILABLE && (
            <CircleCheck
              data-testid="email-input-loading"
              className="h-5 w-auto absolute top-1/2 -translate-y-1/2 right-2 text-green-500 stroke-2"
            />
          )}
        </div>
        {emailCheck === EmailStatus.AVAILABLE && (
          <span data-testid="email-available" className="text-xs text-green-500">
            Email is available
          </span>
        )}
        {emailCheck === EmailStatus.ALREADY_USED && (
          <span data-testid="email-already-used" className="text-xs text-red-500">
            Email already used
          </span>
        )}
        {emailCheck === EmailStatus.INVALID && (
          <span data-testid="email-invalid" className="text-xs text-red-500">
            Invalid email address
          </span>
        )}
      </div>
    </div>
  );
}
