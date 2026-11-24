import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/common";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { firstParam, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/dictionary", title: "Dictionary", description: "Searchable multilingual dictionary of documented languages." });
}

export default async function DictionaryPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const db = createPublicClient();
  const languages = await must<Row[]>(db.from("languages").select("id, name").order("name"), "Loading languages");

  return (
    <>
      <PageHeader
        eyebrow="Linguistic labs"
        title="Digital dictionary"
        intro="Search by word, meaning, language or grammatical category, or browse alphabetically. Entries are entered and verified by the researcher."
      />
      <div className="container-page py-10">
        <DictionarySearch
          languages={languages.map((l) => ({ id: l.id, name: l.name }))}
          initialLanguage={firstParam(searchParams.language)}
        />
      </div>
    </>
  );
}
