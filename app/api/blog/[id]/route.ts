import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET: Public fetch of a single blog post by ID
export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const { id } = await context.params;
    const post = await queryOne(
      `SELECT b.*, u.name as author_name, u.role as author_role FROM blog_posts b
       LEFT JOIN users u ON b.author_id = u.id
       WHERE b.id = ?`,
      [id]
    ) as any;

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

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

    const mappedPost = {
      _id: post.id,
      id: post.id,
      title: post.title,
      subtitle: post.excerpt,
      slug: post.slug,
      content: post.content,
      coverImage: post.cover_image,
      category: post.category,
      readTime: post.read_time,
      tags: tagsArr,
      createdAt: post.created_at,
      publishedAt: post.published_at,
      author: {
        name: post.author_name || "EduCore Team",
        role: post.author_role || "EduCore AI Editor"
      }
    };

    return ok(mappedPost);
  } catch (err) {
    return serverError(err);
  }
};

// PATCH: Authenticated edit of a blog post
export const PATCH = withAuth(
  async (
    req: NextRequest,
    { user }: AuthContext,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    try {
      const id = params?.id;
      if (!id) return badRequest("id parameter is required");

      const existingPost = await queryOne("SELECT author_id FROM blog_posts WHERE id = ?", [id]) as any;
      if (!existingPost) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 });
      }

      // Allow authors or super_admins to edit
      if (existingPost.author_id !== user.id && user.role !== "super_admin") {
        return unauthorized("You do not have permission to edit this post");
      }

      const { title, content, excerpt, coverImage, tags, status, category, readTime } = await req.json();

      let updateQuery = "UPDATE blog_posts SET updated_at = datetime('now')";
      const args: any[] = [];

      if (title !== undefined) {
        updateQuery += ", title = ?";
        args.push(title);
        
        // Also update slug
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
        updateQuery += ", slug = ?";
        args.push(slug);
      }
      if (content !== undefined) {
        updateQuery += ", content = ?";
        args.push(content);
      }
      if (excerpt !== undefined) {
        updateQuery += ", excerpt = ?";
        args.push(excerpt);
      }
      if (coverImage !== undefined) {
        updateQuery += ", cover_image = ?";
        args.push(coverImage);
      }
      if (tags !== undefined) {
        updateQuery += ", tags = ?";
        args.push(tags);
      }
      if (status !== undefined) {
        updateQuery += ", status = ?";
        args.push(status);
        if (status === "published") {
          updateQuery += ", published_at = datetime('now')";
        }
      }
      if (category !== undefined) {
        updateQuery += ", category = ?";
        args.push(category);
      }
      if (readTime !== undefined) {
        updateQuery += ", read_time = ?";
        args.push(readTime);
      }

      updateQuery += " WHERE id = ?";
      args.push(id);

      await execute(updateQuery, args);
      return ok({ message: "Post updated successfully" });
    } catch (err) {
      return serverError(err);
    }
  }
);

// DELETE: Authenticated deletion of a blog post
export const DELETE = withAuth(
  async (
    req: NextRequest,
    { user }: AuthContext,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    try {
      const id = params?.id;
      if (!id) return badRequest("id parameter is required");

      const existingPost = await queryOne("SELECT author_id FROM blog_posts WHERE id = ?", [id]) as any;
      if (!existingPost) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 });
      }

      // Allow authors or super_admins to delete
      if (existingPost.author_id !== user.id && user.role !== "super_admin") {
        return unauthorized("You do not have permission to delete this post");
      }

      await execute("DELETE FROM blog_posts WHERE id = ?", [id]);
      return ok({ message: "Post deleted successfully" });
    } catch (err) {
      return serverError(err);
    }
  }
);
