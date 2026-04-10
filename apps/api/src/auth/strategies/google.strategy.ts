import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { AppConfig } from "../../config/app.config";
import { OAuthUserData } from "../types/jwt.types";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: AppConfig) {
    super({
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const userData: OAuthUserData = {
      provider: "google",
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? "",
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, userData);
  }
}
