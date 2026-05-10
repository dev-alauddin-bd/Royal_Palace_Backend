import teamModel from "../mongoSchema/team.schema";
import { ITeam } from "../interfaces/team.interfaces";

const createTeamMember = async (payload: ITeam) => {
  const result = await teamModel.create(payload);
  return result;
};

import { genericQuery } from "../utils/queryUtils";

const getAllTeamMembers = async (query: Record<string, any> = {}) => {
  const result = await genericQuery({
    model: teamModel,
    query,
    searchFields: ["name", "designation"],
  });
  return result;
};

const updateTeamMember = async (id: string, payload: Partial<ITeam>) => {
  const result = await teamModel.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteTeamMember = async (id: string) => {
  const result = await teamModel.findByIdAndDelete(id);
  return result;
};

export const teamServices = {
  createTeamMember,
  getAllTeamMembers,
  updateTeamMember,
  deleteTeamMember,
};
