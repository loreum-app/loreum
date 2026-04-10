import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AppConfig } from "./config/app.config";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfig);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Cookie parser
  app.use(cookieParser());

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Fallback for any resource type not explicitly listed — restrict to same origin
          defaultSrc: ["'self'"],

          // Only execute JS from your own domain — blocks injected scripts from attacker-controlled servers
          scriptSrc: ["'self'"],

          // Allow inline styles (CSS-in-JS libraries like styled-components/emotion need this unfortunately)
          styleSrc: ["'self'", "'unsafe-inline'"],

          // Allow images from same origin, data URIs (base64 inline images), and any HTTPS source
          imgSrc: ["'self'", "data:", "https:"],

          // Restrict where JS can make network requests — add each third-party API you call from the browser
          connectSrc: ["'self'", "https://api.stripe.com"],

          // Block all iframe embedding — no legitimate reason for iframes in most apps
          frameSrc: ["'none'"],

          // Block Flash, Java applets, and other plugin-based content — legacy attack vector, just kill it
          objectSrc: ["'none'"],

          // Prevent attackers from injecting a <base> tag to redirect all relative URLs to their domain
          baseUri: ["'self'"],

          // Restrict where forms can submit to — prevents form action hijacking via injected HTML
          formAction: ["'self'"],

          // Tell browsers to auto-upgrade any http:// references to https://
          upgradeInsecureRequests: [],
        },
      },

      // Force HTTPS for 1 year, including subdomains — browser won't even attempt HTTP after first visit
      hsts: { maxAge: 31536000, includeSubDomains: true },

      // Prevent your site from being embedded in iframes on other domains — blocks clickjacking attacks
      frameguard: { action: "deny" },

      // Prevent browsers from guessing Content-Type — stops attackers from tricking the browser into
      // executing a JSON or text response as HTML/JS
      noSniff: true,

      // Send the full origin on same-origin requests, only the origin (no path) on cross-origin —
      // prevents leaking internal URL paths to third parties
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  // CORS
  app.enableCors({
    origin: config.api.corsOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "x-csrf-token"],
  });

  // Exception filters
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger (non-production only)
  if (config.isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Loreum API")
      .setDescription("Worldbuilding and story planning platform API")
      .setVersion("0.1.0")
      .addCookieAuth("auth_token")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(config.api.port);
  console.log(`Loreum API running on http://localhost:${config.api.port}`);
  if (config.isDevelopment) {
    console.log(`Swagger docs: http://localhost:${config.api.port}/docs`);
  }
}
bootstrap();
