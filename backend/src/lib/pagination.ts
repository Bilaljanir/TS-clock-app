import * as v from "valibot";

/**
 * Query params de pagination partagés.
 * - page     : numéro de page (>= 1), défaut 1
 * - pageSize : taille de page (1..100), défaut 20
 */
export const PaginationQuerySchema = v.object({
  page: v.pipe(
    v.optional(v.string(), "1"),
    v.regex(/^\d+$/, "page doit être un entier positif."),
    v.transform(Number),
    v.minValue(1, "page doit être supérieur ou égal à 1."),
  ),
  pageSize: v.pipe(
    v.optional(v.string(), "20"),
    v.regex(/^\d+$/, "pageSize doit être un entier positif."),
    v.transform(Number),
    v.minValue(1, "pageSize doit être supérieur ou égal à 1."),
    v.maxValue(100, "pageSize ne peut pas dépasser 100."),
  ),
});

export type PageParams = v.InferOutput<typeof PaginationQuerySchema>;

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/** Assemble la réponse paginée + ses métadonnées. */
export function paginate<T>(
  data: T[],
  total: number,
  { page, pageSize }: PageParams,
): Paginated<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
