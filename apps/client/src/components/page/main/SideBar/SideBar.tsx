import Aside from './Aside';
import ConversationSideBar from './ConversationSideBar';
import MainUserAvatar from './MainUserAvatar';

export default function SideBar() {
  return (
    <section className="flex gap-2 relative w-fit">
      <Aside />
      <ConversationSideBar />
      <MainUserAvatar />
    </section>
  );
}
