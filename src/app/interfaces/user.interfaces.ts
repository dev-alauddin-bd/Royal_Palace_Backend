import { Types } from "mongoose";

export enum UserRole {
  User = "guest",
  Admin = "admin",
  Receptionist = "receptionist",
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  image: string;
  email: string;
  password: string;
  role: UserRole;
  isDeleted: boolean;
  createdAt: Date;
  firebaseUID?: string
  phone?: string;
}

export interface IUserQuery {
  name?: string;
  phone?: string;
  page?: number;
  limit?: number;
  searchTerm?: string;
  select?: string | Record<string, 1 | 0>;
}

// update interfce
export interface IUpdateUserInput {
  name?: string;
  phone?: string;
  image?: string;
}
