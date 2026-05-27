import { Elysia, t } from "elysia";
import { BadRequestError, NotFoundError } from "../../errors";
import * as repo from "./repository";
import { ClockSchema, CreateTimeEntrySchema, UpdateTimeEntrySchema } from "./schema";

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })

    .get("/", async ({ query: { page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" }, set }) => {
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            set.status = 400;
            return { message: "page must be >= 1 and pageSize must be between 1 and 100" };
        }
        return await repo.findAll(page, pageSize, sortBy, sortOrder);
    }, {
        query: t.Object({
            page: t.Optional(t.Numeric()),
            pageSize: t.Optional(t.Numeric()),
            sortBy: t.Optional(t.Union([t.Literal("created_at"), t.Literal("start_time"), t.Literal("end_time"), t.Literal("description"), t.Literal("id")])),
            sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        }),
    })

    .post("/clock", async ({ body, set }) => {
        try {
            return await repo.clock(body);
        } catch (e: any) {
            if (e instanceof BadRequestError) set.status = 400;
            else if (e instanceof NotFoundError) set.status = 404;
            else throw e;
            return { message: e.message };
        }
    }, {
        body: ClockSchema,
    })

    .get("/active", async () => {
        const entry = await repo.findActive();
        return entry ?? { message: "Not clocked in" };
    })

    .get("/:id", async ({ params: { id } }) => {
        const entry = await repo.findById(id);
        if (!entry) throw new NotFoundError("Time entry");
        return entry;
    }, {
        params: t.Object({ id: t.Numeric() }),
    })

    .post("/", async ({ body }) => {
        return await repo.create(body);
    }, {
        body: CreateTimeEntrySchema,
    })

    .put("/:id", async ({ params: { id }, body }) => {
        const entry = await repo.update(id, body);
        if (!entry) throw new NotFoundError("Time entry");
        return entry;
    }, {
        params: t.Object({ id: t.Numeric() }),
        body: UpdateTimeEntrySchema,
    })

    .delete("/:id", async ({ params: { id } }) => {
        const entry = await repo.remove(id);
        if (!entry) throw new NotFoundError("Time entry");
        return { message: "Time entry deleted", entry };
    }, {
        params: t.Object({ id: t.Numeric() }),
    });