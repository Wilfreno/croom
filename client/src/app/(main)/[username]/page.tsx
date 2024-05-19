import { redirect } from "next/navigation";

export default function page({ params }: { params: { username: string } }) {
  redirect("/" + params.username + "/notes");
}
