import ClientMaster from "./client";

export default function Page({ params }: { params: { slug: string } }) {
  return <ClientMaster slug={params.slug} />;
}
