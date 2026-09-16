import sqlite from "@prisma/orm-sqlite/runtime";
import contractJson from "../../../prisma/schema.json";

export const db = sqlite({ contractJson, path: process.env.DATABASE_URL });
