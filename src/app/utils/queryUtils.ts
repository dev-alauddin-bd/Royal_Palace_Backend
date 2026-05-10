// src/app/services/genericQuery.ts
import { Model,PipelineStage } from "mongoose";
import { sanitizeInput } from "../utils/sanitizeInput";

export interface GenericQueryOptions {
  model: Model<any>;
  query: Record<string, any>; // incoming query params
  searchFields?: string[]; // fields for regex search
  lookup?: PipelineStage[]; // optional aggregate stages (e.g. lookup, unwind)
  sort?: Record<string, 1 | -1>;
  select?: string | Record<string, 1 | 0>;
}

export const genericQuery = async (options: GenericQueryOptions) => {
  const {
    model,
    query,
    searchFields = [],
    lookup = [],
    sort: defaultSort = { createdAt: -1 },
    select: defaultSelect,
  } = options;

  // 1️⃣ Sanitize query
  const sanitizedQuery = sanitizeInput(query) ?? {};

  // 2️⃣ Build filters
  const filters: Record<string, any> = { ...sanitizedQuery.filters }; // Start with custom filters if any
  const page = Number(sanitizedQuery.page) || 1;
  const limit = Number(sanitizedQuery.limit) || 10;
  const skip = (page - 1) * limit;

  // Global searchTerm
  if (sanitizedQuery.searchTerm && searchFields.length) {
    filters.$or = searchFields.map((field) => ({
      [field]: { $regex: sanitizedQuery.searchTerm, $options: "i" },
    }));
  }

  // Dynamic Filters (everything else in query that isn't a control field)
  const excludeFields = ["searchTerm", "page", "limit", "sort", "fields", "filters"];
  Object.keys(sanitizedQuery).forEach((key) => {
    if (!excludeFields.includes(key) && sanitizedQuery[key] !== undefined) {
      filters[key] = sanitizedQuery[key];
    }
  });

  // 3️⃣ Sorting & Selection
  const sort = sanitizedQuery.sort 
    ? (typeof sanitizedQuery.sort === 'string' ? { [sanitizedQuery.sort.replace('-', '')]: sanitizedQuery.sort.startsWith('-') ? -1 : 1 } : sanitizedQuery.sort) 
    : defaultSort;
    
  const select = sanitizedQuery.fields || defaultSelect;

  // 4️⃣ Aggregation pipeline
  const pipeline: PipelineStage[] = [{ $match: filters }];
  if (lookup.length) pipeline.push(...lookup);

  // Pagination + project
  let projectStage: any = undefined;
  if (select) {
    projectStage = typeof select === "string"
        ? select.split(" ").filter(Boolean).reduce((acc: any, f) => {
            acc[f] = 1;
            return acc;
          }, {})
        : select;
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: sort as any },
        { $skip: skip },
        { $limit: limit },
        ...(projectStage ? [{ $project: projectStage }] : []),
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  // 5️⃣ Query DB
  const result = await model.aggregate(pipeline);

  return {
    meta: {
      total: result[0]?.totalCount[0]?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((result[0]?.totalCount[0]?.count || 0) / limit)
    },
    data: result[0]?.data || [],
  };
};
