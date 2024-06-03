import MainSideBarNavigation from "./MainSideBarNavigation";
import DirectMessages from "./DirectMessages";
import UserMenu from "./UserMenu";

export default function MainLeftSideBar() {
  return (
    <section className="w-1/5 h-full flex flex-col border-r justify-between">
      <MainSideBarNavigation />
      <DirectMessages />
      <UserMenu />
    </section>
  );
}
