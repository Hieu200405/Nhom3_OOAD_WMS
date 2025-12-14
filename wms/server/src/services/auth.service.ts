import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { USER_ROLES, type UserRole } from '@wms/shared';
import { UserModel } from '../models/user.model.js';
import type { UserDocument } from '../models/user.model.js';
import { env } from '../config/env.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  actorId: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const buildTokenPayload = (user: { id: string; role: UserRole; email: string; fullName: string }) => ({
  sub: user.id,
  role: user.role,
  email: user.email,
  fullName: user.fullName
});

const signToken = (
  payload: ReturnType<typeof buildTokenPayload>,
  secret: Secret,
  expiresIn: SignOptions['expiresIn']
) => jwt.sign(payload, secret, { expiresIn });

const signAccessToken = (payload: ReturnType<typeof buildTokenPayload>) =>
  signToken(payload, env.jwtSecret as Secret, env.jwtExpiresIn as SignOptions['expiresIn']);

const signRefreshToken = (payload: ReturnType<typeof buildTokenPayload>) =>
  signToken(payload, env.jwtRefreshSecret as Secret, env.jwtRefreshExpiresIn as SignOptions['expiresIn']);

export const registerUser = async ({ email, password, fullName, role, actorId }: RegisterInput) => {
  if (!USER_ROLES.includes(role)) {
    throw badRequest('Invalid role');
  }
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw conflict('Email already in use');
  }
  const passwordHash = await bcrypt.hash(password, env.saltRounds);
  const user = await UserModel.create({ email, passwordHash, fullName, role });
  await recordAudit({
    action: 'user.created',
    entity: 'User',
    entityId: user._id as Types.ObjectId,
    actorId,
    payload: { email, fullName, role }
  });
  return user.toObject();
};

export const login = async ({ email, password }: LoginInput) => {
  const user = (await UserModel.findOne({ email })) as UserDocument | null;
  if (!user || !user.isActive) {
    throw unauthorized('Invalid credentials');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw unauthorized('Invalid credentials');
  }
  const id = (user._id as Types.ObjectId).toString();
  const base = {
    id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
  const accessToken = signAccessToken(buildTokenPayload(base));
  const refreshToken = signRefreshToken(buildTokenPayload(base));
  return {
    user: base,
    accessToken,
    refreshToken
  };
};

export const getProfile = async (userId: string) => {
  const user = await UserModel.findById(new Types.ObjectId(userId)).lean();
  if (!user) {
    throw unauthorized('User not found');
  }
  const id = (user._id as Types.ObjectId).toString();
  return {
    id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive
  };
};
