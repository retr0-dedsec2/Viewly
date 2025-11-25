// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import Parse from "@/lib/parseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe obligatoires" },
        { status: 400 }
      );
    }

    const user = await Parse.User.logIn(email, password);

    // Tu peux générer un token JWT ici si tu veux
    return NextResponse.json(
      {
        id: user.id,
        email: user.get("email"),
        name: user.get("name") ?? null,
        sessionToken: user.getSessionToken?.(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  }
}
