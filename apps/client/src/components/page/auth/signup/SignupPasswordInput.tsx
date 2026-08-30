import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignUpFieldProps } from '@repo/types';
import { Eye, EyeOff } from 'lucide-react';
import { CSSProperties, useState } from 'react';
import SignUpPasswordStrength from './SignUpPasswordStrength';

export default function SignupPasswordInput({ formData, setFormData }: SignUpFieldProps) {
  const [seePassword, setSeePassword] = useState([false, false]);

  const { getStrengthColor } = usePasswordStrengthChecker(formData.password);

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="grid gap-1">
          <div className="grid gap-2">
            <div className="relative">
              <Input
                required
                type={seePassword[0] ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                style={
                  {
                    '--strength-ring': formData.password ? getStrengthColor() : undefined,
                  } as CSSProperties
                }
                className="focus-visible:ring-[color:var(--strength-ring,hsl(var(--ring)))]"
              />
              <Button
                data-testid="see-password-1"
                type="button"
                variant="ghost"
                size="icon"
                className="p-2 absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
              >
                {seePassword[0] ? (
                  <Eye data-testid="eye-on-1" className="h-full w-auto" />
                ) : (
                  <EyeOff data-testid="eye-off-1" className="h-full w-auto" />
                )}
              </Button>
            </div>
            <SignUpPasswordStrength password={formData.password} />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="grid gap-1">
          <div className="relative">
            <Input
              required
              disabled={formData.password.length < 8}
              type={seePassword[1] ? 'text' : 'password'}
              id="confirm-password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            <Button
              disabled={!formData.password}
              data-testid="see-password-2"
              type="button"
              variant="ghost"
              size="icon"
              className="p-2 absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
            >
              {seePassword[1] ? (
                <Eye data-testid="eye-on-2" className="h-full w-auto" />
              ) : (
                <EyeOff data-testid="eye-off-2" className="h-full w-auto" />
              )}
            </Button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <span data-testid="password-not-same" className="text-xs text-muted-foreground text-red-500">
              Password is not the same
            </span>
          )}
        </div>
      </div>
    </>
  );
}
