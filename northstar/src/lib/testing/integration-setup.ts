import { afterAll } from "vitest";
import { db } from "@/lib/db/prisma";

let closed = false;

afterAll(async () => {
  if (closed) return;
  closed = true;
  await db.close();
});
