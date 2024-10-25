// src/passport-config.ts
import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserService } from "@src/services/userService";
import bcrypt from "bcryptjs";
export default function initializePassport(passport: PassportStatic) {
  const userService = new UserService();

  // 序列化用戶
  passport.serializeUser((user: Express.User, done) => {
    done(null, user._id);
  });

  // 反序列化用戶
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userService.findUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // 默認為 'username'
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // 使用 UserService 查找用戶
          const user = await userService.findUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "沒有這個用戶" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "密碼錯誤" });
          }
        } catch (err) {
          return done(err);
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
  //               username: profile.displayName,
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
