// lib/parseServer.ts
import Parse from "parse/node";

if (
  !process.env.NEXT_PUBLIC_PARSE_APP_ID ||
  !process.env.NEXT_PUBLIC_PARSE_JS_KEY ||
  !process.env.NEXT_PUBLIC_PARSE_SERVER_URL
) {
  throw new Error("⚠️ Variables Parse manquantes dans .env");
}

Parse.initialize(
  process.env.NEXT_PUBLIC_PARSE_APP_ID,
  process.env.NEXT_PUBLIC_PARSE_JS_KEY
);
Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

export default Parse;
