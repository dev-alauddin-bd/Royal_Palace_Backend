import { model, Schema } from "mongoose";
import { ITeam } from "../interfaces/team.interfaces";

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: [true, "Name is required"] },
    role: { type: String, required: [true, "Role is required"] },
    image: { type: String, required: [true, "Image is required"] },
  },
  {
    timestamps: true,
  }
);

const teamModel = model<ITeam>("Team", teamSchema);
export default teamModel;
