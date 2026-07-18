/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleImageUploader } from "@/components/admin/article-image-uploader";
import { ArticlePublishControl } from "@/components/admin/article-publish-control";
import { ContentStatus } from "@/components/admin/content-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getArticleEditorData } from "@/lib/articles/service";
import { ARTICLE_BLOCK_TYPES } from "@/lib/articles/validation";
import { createContentImageSignedUrls } from "@/lib/content-images/service";

import {
  addArticleSectionAction, addArticleSourceAction, archiveArticleAction, assignCategoryAction, assignTagAction,
  publishArticleAction, removeArticleImageAction, removeArticleSourceAction, removeCategoryAction, removeTagAction,
  saveArticleFieldsAction, saveArticleSectionsAction, setFeaturedImageAction,
} from "./actions";

const EXAMPLES: Record<string, string> = {
  heading: "Section heading", paragraph: "Article paragraph text", tip: "Useful practical tip", warning: "Important warning",
  list: '{"items":["First item","Second item"],"ordered":false}',
  comparison_table: '{"headers":["Option","Benefit"],"rows":[["A","Example"]]}',
  faq_group: '{"items":[{"question":"Question?","answer":"Answer."}]}',
  image: '{"imageId":"content-image-uuid"}', related_content: '{"contentId":"uuid","contentType":"care_guide"}',
};

export default async function ArticleEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const notices = await searchParams;
  const editor = await getArticleEditorData(id);
  if (!editor) notFound();
  const { article, sections, images, sources, categories, tags, allCategories, allTags } = editor;
  const isEditable = article.status !== "published";
  const imageUrls = await createContentImageSignedUrls(images.map((image) => image.content_images.storage_path));
  const assignedCategoryIds = new Set(categories.map((item) => item.category_id));
  const assignedTagIds = new Set(tags.map((item) => item.tag_id));

  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-xl font-semibold">{article.title ?? "Untitled Article"}</h2><ContentStatus status={article.status} /></div><p className="mt-1 text-sm text-muted-foreground">Flexible educational article · images optional</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link href={`/admin/articles/${id}/preview`}>Preview</Link></Button><Button asChild variant="outline"><Link href="/admin/articles">Back</Link></Button></div></div>
    {notices.saved ? <p role="status" className="border border-green-700/40 bg-green-500/10 p-3 text-sm">{notices.saved}</p> : null}
    {notices.error ? <p role="alert" className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{notices.error}</p> : null}
    {!isEditable ? <p className="border border-amber-700/40 bg-amber-500/10 p-3 text-sm">Published content is read-only. Archive it before making changes.</p> : null}

    <form action={saveArticleFieldsAction.bind(null, id)} className="border border-border bg-card p-5"><fieldset disabled={!isEditable} className="grid gap-4 md:grid-cols-2"><legend className="mb-4 text-lg font-semibold">Publishing and SEO</legend><label className="space-y-1"><span className="text-sm font-medium">Title *</span><Input name="title" defaultValue={article.title ?? ""} /></label><label className="space-y-1"><span className="text-sm font-medium">Slug *</span><Input name="slug" defaultValue={article.slug ?? ""} /></label><label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Summary *</span><textarea name="summary" defaultValue={article.summary ?? ""} rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm" /></label><label className="space-y-1"><span className="text-sm font-medium">SEO title</span><Input name="seoTitle" defaultValue={article.seo_title ?? ""} /></label><label className="space-y-1"><span className="text-sm font-medium">Canonical URL</span><Input name="canonicalUrl" type="url" defaultValue={article.canonical_url ?? ""} /></label><label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Meta description</span><textarea name="metaDescription" defaultValue={article.meta_description ?? ""} rows={3} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={article.is_featured} /> Featured</label><div className="md:col-span-2"><Button type="submit">Save publishing fields</Button></div></fieldset></form>

    <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Ordered article sections</h3><p className="mt-1 text-sm text-muted-foreground">Text blocks accept plain text. Lists, tables, FAQs, images, and related content use the shown JSON structure.</p>
      {sections.length ? <form action={saveArticleSectionsAction.bind(null, id)} className="mt-4 space-y-4"><fieldset disabled={!isEditable}>{sections.map((section) => <div key={section.id} className="mb-4 grid gap-3 border border-border p-4 md:grid-cols-[9rem_7rem_1fr]"><input type="hidden" name="sectionId" value={section.id} /><label className="space-y-1"><span className="text-sm font-medium">Block type</span><select name="blockType" defaultValue={section.block_type} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm">{ARTICLE_BLOCK_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><label className="space-y-1"><span className="text-sm font-medium">Order</span><Input name="displayOrder" type="number" min="0" defaultValue={section.display_order} /></label><label className="space-y-1"><span className="text-sm font-medium">Content</span><textarea name="content" defaultValue={JSON.stringify(section.content, null, 2)} rows={5} className="w-full rounded-lg border border-input bg-background p-2.5 font-mono text-xs" /></label></div>)}<Button type="submit">Save section content and order</Button></fieldset></form> : <p className="mt-4 text-sm">No sections yet. Add the first block below.</p>}
      {isEditable ? <form action={addArticleSectionAction.bind(null, id, sections.length)} className="mt-5 grid gap-3 border border-border bg-background p-4 md:grid-cols-[12rem_1fr_auto]"><select name="blockType" className="h-8 rounded-lg border border-input bg-background px-2 text-sm">{ARTICLE_BLOCK_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select><Input name="content" placeholder={EXAMPLES.paragraph} required /><Button type="submit">Add section</Button><p className="text-xs text-muted-foreground md:col-span-3">Structured examples: list {EXAMPLES.list} · FAQ {EXAMPLES.faq_group}</p></form> : null}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Categories</h3><ul className="mt-3 space-y-2">{categories.map((item) => <li key={item.category_id} className="flex items-center justify-between border border-border p-3 text-sm"><span>{item.article_categories.name}</span>{isEditable ? <form action={removeCategoryAction.bind(null, id)}><input type="hidden" name="categoryId" value={item.category_id} /><Button size="sm" variant="outline">Remove</Button></form> : null}</li>)}</ul>{isEditable ? <form action={assignCategoryAction.bind(null, id)} className="mt-4 flex gap-2"><select name="categoryId" className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm">{allCategories.filter((item) => !assignedCategoryIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button type="submit">Assign</Button></form> : null}</div>
      <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Tags</h3><ul className="mt-3 flex flex-wrap gap-2">{tags.map((item) => <li key={item.tag_id} className="flex items-center gap-2 border border-border p-2 text-sm"><span>{item.article_tags.name}</span>{isEditable ? <form action={removeTagAction.bind(null, id)}><input type="hidden" name="tagId" value={item.tag_id} /><Button size="sm" variant="outline">Remove</Button></form> : null}</li>)}</ul>{isEditable ? <form action={assignTagAction.bind(null, id)} className="mt-4 flex gap-2"><select name="tagId" className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm">{allTags.filter((item) => !assignedTagIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button type="submit">Assign</Button></form> : null}</div>
    </div>

    <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Article images</h3><p className="mt-1 text-sm text-muted-foreground">Optional. Upload only when an image improves the article.</p>{isEditable ? <div className="mt-4"><ArticleImageUploader articleId={id} nextOrder={images.length} /></div> : null}<div className="mt-4 grid gap-4 md:grid-cols-2">{images.map((assignment) => <article key={assignment.image_id} className="border border-border p-4"><img src={imageUrls.get(assignment.content_images.storage_path)} alt={assignment.content_images.alt_text ?? ""} className="h-48 w-full bg-muted object-contain" /><p className="mt-2 text-sm">{assignment.content_images.alt_text ?? "No alt text"}</p>{isEditable ? <div className="mt-3 flex gap-2">{article.featured_image_id !== assignment.image_id ? <form action={setFeaturedImageAction.bind(null, id)}><input type="hidden" name="imageId" value={assignment.image_id} /><Button size="sm" variant="outline">Set featured</Button></form> : <span className="text-sm font-medium">Featured image</span>}<form action={removeArticleImageAction.bind(null, id)}><input type="hidden" name="imageId" value={assignment.image_id} /><Button size="sm" variant="outline">Remove</Button></form></div> : null}</article>)}</div></div>

    <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Sources</h3><ul className="mt-3 space-y-2">{sources.map((item) => <li key={item.source_id} className="border border-border p-3 text-sm"><p className="font-medium">{item.sources.title}</p><p className="text-muted-foreground">{item.sources.publisher ?? item.sources.url}</p>{isEditable ? <form action={removeArticleSourceAction.bind(null, id)} className="mt-2"><input type="hidden" name="sourceId" value={item.source_id} /><Button size="sm" variant="outline">Remove</Button></form> : null}</li>)}</ul>{isEditable ? <form action={addArticleSourceAction.bind(null, id, sources.length)} className="mt-4 grid gap-3 md:grid-cols-2"><Input name="title" placeholder="Source title" required /><Input name="publisher" placeholder="Publisher" /><Input name="author" placeholder="Author" /><Input name="url" type="url" placeholder="https://…" /><select name="sourceType" className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option value="website">Website</option><option value="journal">Journal</option><option value="book">Book</option><option value="organization">Organization</option><option value="database">Database</option><option value="other">Other</option></select><Input name="accessedDate" type="date" /><Input name="citationLabel" placeholder="Citation label" /><div><Button type="submit">Add source</Button></div></form> : null}</div>

    <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Publishing workflow</h3><div className="mt-4">{article.status === "published" ? <form action={archiveArticleAction.bind(null, id)}><Button type="submit" variant="outline">Archive article</Button></form> : <ArticlePublishControl action={publishArticleAction.bind(null, id)} />}</div></div>
  </section>;
}
