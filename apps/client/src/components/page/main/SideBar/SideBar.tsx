import Aside from './Aside';
import ConversationSideBar from './ConversationSideBar';
import UserSideBar from './UserSidebar';

export default function SideBar() {
  return (
    <section className="flex gap-2 relative">
      <Aside />
      <ConversationSideBar />
      <UserSideBar />
    </section>
  );
}
