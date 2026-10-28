import { Schema, model, type Document } from 'mongoose';

export interface IUser {
  githubId: string;
  username: string;
  avatarUrl?: string;
  accessToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = Document & IUser;

const userSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Prevents accidental token exposure in query projections
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
