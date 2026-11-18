import InitialsFallback from '@/components/page/main/InitialsFallback';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function MemberAvatar({
  name,
  colorKey,
  photoUrl,
  className,
}: {
  name?: string;
  colorKey?: string;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={photoUrl ?? undefined} />
      <InitialsFallback name={name} colorKey={colorKey} />
    </Avatar>
  );
}
