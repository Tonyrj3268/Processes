// src/passport-config.ts
import { PassportStatic } from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { userService } from "@src/services/userService";
import { JWT_SECRET } from "@src/config/config";
export default function initializePassport(passport: PassportStatic) {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 從 Authorization 標頭中提取 token
        secretOrKey: JWT_SECRET, // 用於驗證 JWT 的密鑰
      },
      async (jwtPayload, done) => {
        try {
          // 根據 JWT 載荷中的 id 查找用戶
          const user = await userService.findUserById(jwtPayload.id);
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  //   // Google OAuth 策略
  //   passport.use(
  //     new GoogleStrategy(
  //       {
  //         clientID: process.env.GOOGLE_CLIENT_ID || "你的 Google Client ID",
  //         clientSecret:
  //           process.env.GOOGLE_CLIENT_SECRET || "你的 Google Client Secret",
  //         callbackURL: "/auth/google/callback",
  //       },
  //       async (accessToken, refreshToken, profile, done) => {
  //         try {
  //           // 使用 UserService 查找或創建用戶
  //           let user = await userService.findUserByGoogleId(profile.id);
  //           if (user) {
  //             return done(null, user);
  //           } else {
  //             // 創建新用戶
  //             const newUser = await userService.createGoogleUser({
  //               userName: profile.displayName,
  //               email: profile.emails ? profile.emails[0].value : "",
  //               googleId: profile.id,
  //             });
  //             return done(null, newUser);
  //           }
  //         } catch (err) {
  //           return done(err, null);
  //         }
  //       }
  //     )
  //   );
}
