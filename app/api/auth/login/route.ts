// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { findUserByEmail, setTwoFactorCode } from "@/lib/auth-db";
import { setAuthCookie } from "@/lib/auth-tokens";
import { sendTwoFactorCode } from "@/lib/email";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const codeHash = await bcrypt.hash(code, 10)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await setTwoFactorCode(user.id, codeHash, expiresAt)
      try {
        await sendTwoFactorCode(user.email, code)
      } catch (error: any) {
        const details = error?.code === 'EAUTH' ? 'SMTP authentication failed. Use an app password or update SMTP credentials.' : 'Unable to send verification email. Check SMTP settings.'
        return NextResponse.json(
          { error: details },
          { status: 503 }
        )
      }
      return NextResponse.json({
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Verification code sent to your email',
      })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
    });

    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        hasAds: user.hasAds,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
    },
      { status: 200 }
    );
    setAuthCookie(response, token)
    return response
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
