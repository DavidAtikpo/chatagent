import { redirect } from "next/navigation";

/** Handoff : même écran que la conversation (logique app mobile). */
export default function InboxConversationRedirect({ params }: { params: { id: string } }) {
  redirect(`/dashboard/conversations/${params.id}`);
}
