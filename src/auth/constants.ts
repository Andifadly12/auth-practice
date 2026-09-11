import 'dotenv/config';

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'dev_secret',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    `${process.env.JWT_SECRET ?? 'dev_secret'}:refresh`,
};
