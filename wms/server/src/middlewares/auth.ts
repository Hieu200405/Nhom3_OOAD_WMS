import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../utils/errors.js';
import { UserModel } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

interface TokenPayload {
  sub: string;
  role: string;
  email: string;
  fullName: string;
}

export const auth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized();
  }
  const token = header.split(' ')[1];
  /* Support for Mock Token in Development */
  if (token.startsWith('mock-token-') && env.nodeEnv === 'development') {
    const userId = token.replace('mock-token-', '');
    // Mock user data mapping based on frontend constants
    const roleMapping: Record<string, string> = {
      'user-admin': 'Admin',
      'user-manager': 'Manager',
      'user-staff': 'Staff'
    };
    req.user = {
      id: userId,
      email: `${userId}@example.com`,
      fullName: 'Mock User',
      role: roleMapping[userId] || 'Staff'
    };
    req.authToken = token;
    next();
    return;
  }

  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch (error) {
    throw unauthorized();
  }

  const user = await UserModel.findById(decoded.sub).lean();
  if (!user || !user.isActive) {
    throw forbidden('User inactive or not found');
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
  req.authToken = token;
  next();
});
