export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Parse from "@/lib/parseServer";

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const tokenHeader = req.headers.get("x-session-token");

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : tokenHeader?.trim();

  if (!token) return null;

  try {
    const user = await Parse.User.become(token);
    return user;
  } catch (e) {
    console.error("Invalid session token:", e);
    return null;
  }
}

// GET /api/liked -> liste des likes de l'utilisateur
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const LikeItem = Parse.Object.extend("LikeItem");
    const query = new Parse.Query(LikeItem);
    query.equalTo("user", user);
    query.descending("createdAt");

    const results = await query.find();

    const items = results.map((obj) => ({
      id: obj.id,
      youtubeId: obj.get("youtubeId"),
      title: obj.get("title"),
      artist: obj.get("artist"),
      thumbnail: obj.get("thumbnail"),
      duration: obj.get("duration"),
      createdAt: obj.createdAt,
    }));

    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/liked error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/liked -> like un morceau
// Body : { youtubeId, title, artist, thumbnail, duration }
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { youtubeId, title, artist, thumbnail, duration } = body;

    if (!youtubeId) {
      return NextResponse.json(
        { error: "youtubeId est obligatoire" },
        { status: 400 }
      );
    }

    const LikeItem = Parse.Object.extend("LikeItem");
    const query = new Parse.Query(LikeItem);
    query.equalTo("user", user);
    query.equalTo("youtubeId", youtubeId);

    const existing = await query.first();
    if (existing) {
      return NextResponse.json(
        { error: "Déjà liké" },
        { status: 409 }
      );
    }

    const like = new LikeItem();
    like.set("user", user);
    like.set("youtubeId", youtubeId);
    like.set("title", title ?? null);
    like.set("artist", artist ?? null);
    like.set("thumbnail", thumbnail ?? null);
    like.set("duration", duration ?? null);

    const saved = await like.save();

    return NextResponse.json(
      {
        id: saved.id,
        youtubeId: saved.get("youtubeId"),
        title: saved.get("title"),
        artist: saved.get("artist"),
        thumbnail: saved.get("thumbnail"),
        duration: saved.get("duration"),
        createdAt: saved.createdAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/liked error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/liked -> retire un like
// Body : { id } OU { youtubeId }
export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, youtubeId } = body;

    if (!id && !youtubeId) {
      return NextResponse.json(
        { error: "id ou youtubeId est obligatoire" },
        { status: 400 }
      );
    }

    const LikeItem = Parse.Object.extend("LikeItem");
    const query = new Parse.Query(LikeItem);
    query.equalTo("user", user);

    if (id) query.equalTo("objectId", id);
    else query.equalTo("youtubeId", youtubeId);

    const like = await query.first();

    if (!like) {
      return NextResponse.json(
        { error: "Like introuvable" },
        { status: 404 }
      );
    }

    await like.destroy();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/liked error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
