import { redirect } from "next/navigation";

type LegacySpeciesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LegacySpeciesPage({
  params,
}: LegacySpeciesPageProps) {
  const { slug } = await params;

  redirect(`/species/${slug}`);
}
