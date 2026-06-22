/**
 * Erreurs applicatives + format JSON cohérent pour toute l'API.
 *
 * Toutes les réponses d'erreur ont la même forme :
 *   { "error": { "code": "...", "message": "...", "issues"?: [...] } }
 */

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

/** Erreur métier connue, transformée en réponse HTTP propre. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON(): ErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.issues ? { issues: this.issues } : {}),
      },
    };
  }
}

/** 404 — ressource introuvable. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
  }
}

/** 409 — conflit (ex : suppression interdite par une contrainte). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

/** 422 — échec de validation Valibot. */
export class ValidationError extends AppError {
  constructor(issues: { path: string; message: string }[]) {
    super(422, "VALIDATION", "Les données envoyées sont invalides.", issues);
  }
}
