import { useState } from "react";
import NewRoomType from "./NewRoomType";
import NewRoomNameAndPhoto from "./NewRoomNameAndPhoto";

export default function NewRoomForm() {
  const [component_view, setComponentView] = useState(0);

  return (
    <form>
      <NewRoomNameAndPhoto
        component_view={component_view}
        setComponentView={setComponentView}
      />
      <NewRoomType
        component_view={component_view}
        setComponentView={setComponentView}
      />
    </form>
  );
}
