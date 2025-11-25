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

// GET /api/library -> liste des morceaux de la bibliothèque de l'utilisateur
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const LibraryItem = Parse.Object.extend("LibraryItem");
    const query = new Parse.Query(LibraryItem);
    query.equalTo("user", user);
    query.descending("createdAt");

    const results = await query.find();

    const items = results.map((obj) => ({
      id: obj.id,
      title: obj.get("title"),
      artist: obj.get("artist"),
      youtubeId: obj.get("youtubeId"),
      thumbnail: obj.get("thumbnail"),
      duration: obj.get("duration"),
      createdAt: obj.createdAt,
    }));

    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/library error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/library -> ajoute un nouveau morceau à la bibliothèque
// Body JSON : { title, artist, youtubeId, thumbnail, duration }
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
    const { title, artist, youtubeId, thumbnail, duration } = body;

    if (!title || !youtubeId) {
      return NextResponse.json(
        { error: "title et youtubeId sont obligatoires" },
        { status: 400 }
      );
    }

    const LibraryItem = Parse.Object.extend("LibraryItem");
    const item = new LibraryItem();

    item.set("user", user);
    item.set("title", title);
    item.set("artist", artist ?? null);
    item.set("youtubeId", youtubeId);
    item.set("thumbnail", thumbnail ?? null);
    item.set("duration", duration ?? null);

    const saved = await item.save();

    return NextResponse.json(
      {
        id: saved.id,
        title: saved.get("title"),
        artist: saved.get("artist"),
        youtubeId: saved.get("youtubeId"),
        thumbnail: saved.get("thumbnail"),
        duration: saved.get("duration"),
        createdAt: saved.createdAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/library error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/library -> supprime un morceau
// Body JSON : { id }
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id est obligatoire" },
        { status: 400 }
      );
    }

    const LibraryItem = Parse.Object.extend("LibraryItem");
    const query = new Parse.Query(LibraryItem);
    query.equalTo("objectId", id);
    query.equalTo("user", user);

    const item = await query.first();

    if (!item) {
      return NextResponse.json(
        { error: "Élément introuvable" },
        { status: 404 }
      );
    }

    await item.destroy();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/library error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
