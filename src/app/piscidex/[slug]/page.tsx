import SpeciesPage, {
  generateMetadata as generateSpeciesMetadata,
  generateStaticParams as generateSpeciesStaticParams,
} from "../../species/[slug]/page";

type PisciDexSpeciesPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  return generateSpeciesStaticParams();
}

export async function generateMetadata(props: PisciDexSpeciesPageProps) {
  return generateSpeciesMetadata(props);
}

export default function PisciDexSpeciesPage(props: PisciDexSpeciesPageProps) {
  return <SpeciesPage {...props} />;
}
