// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import Parse from "@/lib/parseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const query = new Parse.Query(Parse.User);
    query.equalTo("username", email);
    const existing = await query.first({ useMasterKey: false });

    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Créer un utilisateur Parse
    const user = new Parse.User();
    user.set("username", email);
    user.set("email", email);
    user.set("password", password);
    if (name) user.set("name", name);

    const result = await user.signUp();

    return NextResponse.json(
      {
        id: result.id,
        email: result.get("email"),
        name: result.get("name") ?? null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
