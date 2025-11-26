// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { findUserByEmail, createUser } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await createUser(email, username, hashedPassword);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
