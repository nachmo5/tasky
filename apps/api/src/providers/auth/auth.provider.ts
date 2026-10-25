import { and, eq } from "drizzle-orm";
import type { User } from "../../operations/types.operation.ts";
import type { Providers } from "../types.provider.ts";
import { dbSessions, dbUsers } from "@repo/database";
import { verifyHash } from "../../lib/crypto.ts";
import { AUTH_SESSION_EXPIRATION, MAX_LOGIN_ATTEMPTS } from "../../config/auth.ts";
import { TooManyLoginAttemptsError, InvalidCredentialsError } from "./errors.auth.ts";

export class AuthProvider {
  private providers;

  constructor(providers: Pick<Providers, "db" | "cache">) {
    this.providers = providers;
  }

  async login(username: string, password: string): Promise<{ user: User; sessionId: string }> {
    const { count } = await this.providers.cache.increment("login-attempts", [username]);

    if (count > MAX_LOGIN_ATTEMPTS) {
      throw new TooManyLoginAttemptsError();
    }
    const [userRow] = await this.providers.db.client
      .select()
      .from(dbUsers)
      .where(and(eq(dbUsers.username, username)))
      .limit(1);

    if (!userRow || !(await verifyHash(userRow.passwordHash, password))) {
      throw new InvalidCredentialsError();
    }

    await this.providers.cache.delete("login-attempts", [username]);
    const [sessionRow] = await this.providers.db.client
      .insert(dbSessions)
      .values({
        userId: userRow.id,
        expiresAt: new Date(new Date().getTime() + AUTH_SESSION_EXPIRATION),
      })
      .returning();

    return { sessionId: sessionRow!.id, user: { id: userRow.id, name: userRow.name } };
  }

  async logout(sessionId: string): Promise<void> {
    await this.providers.db.client.delete(dbSessions).where(eq(dbSessions.id, sessionId));
  }

  async verify(sessionId: string): Promise<User | null> {
    const sessionRow = await this.providers.db.client.query.dbSessions.findFirst({
      where: { id: sessionId },
      with: { dbUser: true },
    });

    if (!sessionRow) {
      return null;
    }

    if (sessionRow.expiresAt > new Date()) {
      return { id: sessionRow.userId, name: sessionRow.dbUser.name };
    }

    await this.providers.db.client.delete(dbSessions).where(eq(dbSessions.id, sessionRow.id));
    return null;
  }
}
