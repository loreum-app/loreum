import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfig {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.configService.get("NODE_ENV") !== "production";
  }

  get isProduction(): boolean {
    return this.configService.get("NODE_ENV") === "production";
  }

  get api() {
    return {
      port: parseInt(this.configService.get("API_PORT") ?? "3021", 10),
      corsOrigin:
        this.configService.get("CORS_ORIGIN") ?? "http://localhost:3020",
    };
  }

  get jwt() {
    return {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      accessTTL: this.configService.get("JWT_ACCESS_TTL") ?? "2h",
      rotationMinutes: parseInt(
        this.configService.get("TOKEN_ROTATION_MINUTES") ?? "100",
        10,
      ),
    };
  }

  get session() {
    return {
      ttlDays: parseInt(this.configService.get("SESSION_TTL_DAYS") ?? "60", 10),
    };
  }

  get cookies(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    maxAge: number;
    path: string;
    domain?: string;
  } {
    const domain = this.configService.get("COOKIE_DOMAIN") ?? undefined;

    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: "lax",
      maxAge: this.session.ttlDays * 24 * 60 * 60 * 1000,
      path: "/",
      ...(domain && { domain }),
    };
  }

  get google() {
    return {
      clientId: this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: this.configService.getOrThrow<string>(
        "GOOGLE_CLIENT_SECRET",
      ),
      callbackUrl: this.configService.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
    };
  }

  get redis() {
    return {
      url: this.configService.get("REDIS_URL") ?? "redis://localhost:6379",
    };
  }

  get database() {
    return {
      url: this.configService.getOrThrow<string>("DATABASE_URL"),
    };
  }
}
