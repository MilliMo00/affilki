import Link from "next/link";
import { Badge, PageTitle, Table } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

const STATUS = { DRAFT: ["черновик", "neutral"], PUBLISHED: ["опубликована", "good"], ARCHIVED: ["в архиве", "neutral"] } as const;

export default async function ArticlesAdminPage() {
  await requirePermission("content");
  const articles = await db.article.findMany({ orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], include: { category: true }, take: 300 });

  return (
    <>
      <PageTitle title="Статьи" lead="Материалы из заявок появляются здесь после одобрения. Свои статьи можно писать сразу.">
        <div className="flex flex-wrap gap-3">
          <Link href={adminUrl("/categories")} className="flex h-11 items-center rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow">
            Рубрики
          </Link>
          <Link href={adminUrl("/articles/new")} className="focus-on-bright flex h-11 items-center rounded-full bg-paper px-5 font-semibold text-deep hover:bg-text">
            Новая статья
          </Link>
        </div>
      </PageTitle>
      <Table head={["Заголовок", "Рубрика", "Статус", "Дата", "Просмотры"]}>
        {articles.map((article) => (
          <tr key={article.id}>
            <td>
              <Link href={adminUrl(`/articles/${article.id}`)} className="font-medium text-paper hover:underline">
                {article.title}
              </Link>
            </td>
            <td className="text-muted">{article.category.title}</td>
            <td>
              <Badge tone={STATUS[article.status][1]}>{STATUS[article.status][0]}</Badge>
            </td>
            <td className="whitespace-nowrap text-muted">{article.publishedAt ? formatDate(article.publishedAt) : "—"}</td>
            <td className="tabular-nums">{article.views}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
