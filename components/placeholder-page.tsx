import { PageHeader } from "@/components/page-header";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1480px]">
      <PageHeader title={title} description={description} />
    </div>
  );
}
