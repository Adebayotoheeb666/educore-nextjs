import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "published";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const offset = (page - 1) * limit;

    const args: (string | number | boolean | null)[] = [status];
    let queryStr = `SELECT b.*, u.name as author_name FROM blog_posts b
                    LEFT JOIN users u ON b.author_id = u.id
                    WHERE b.status = ?`;

    if (category) {
      queryStr += " AND b.category = ?";
      args.push(category);
    }

    const countArgs = [...args];
    const totalPostsResult = await query(`SELECT COUNT(*) as count FROM (${queryStr})`, countArgs);
    const totalPosts = (totalPostsResult[0] as any)?.count || 0;
    const totalPages = Math.ceil(totalPosts / limit);

    queryStr += " ORDER BY b.published_at DESC, b.created_at DESC LIMIT ? OFFSET ?";
    args.push(limit, offset);

    const posts = await query(queryStr, args);
    const mappedPosts = posts.map((post: any) => {
      let tagsArr: string[] = [];
      if (post.tags) {
        try {
          tagsArr = JSON.parse(post.tags);
          if (!Array.isArray(tagsArr)) {
            tagsArr = post.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
          }
        } catch {
          tagsArr = post.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      }

      return {
        _id: post.id,
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.cover_image,
        category: post.category,
        readTime: post.read_time,
        tags: tagsArr,
        createdAt: post.created_at,
        publishedAt: post.published_at,
        author: {
          name: post.author_name || "EduCore Team",
          role: "EduCore AI Editor"
        }
      };
    });

    return ok({
      blogPosts: mappedPosts,
      totalPages,
      totalPosts,
      page
    });
  } catch (err) { return serverError(err); }
};

export const POST = withAuth(async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    const { title, content, excerpt, coverImage, tags, status, category, readTime } = await req.json();
    if (!title || !content) return badRequest("title and content are required");

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      + "-" + Date.now();
    const id = generateId();
    const postStatus = status || "draft";

    await execute(
      `INSERT INTO blog_posts (id, title, slug, content, excerpt, cover_image, author_id, school_id, status, published_at, tags, category, read_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, title, slug, content, excerpt || null, coverImage || null, user.id, school?.id || null,
       postStatus, postStatus === "published" ? new Date().toISOString() : null, tags || null, category || "Company News", readTime || "5 min read"]
    );
    return created({ id, slug, title });
  } catch (err) { return serverError(err); }
});
