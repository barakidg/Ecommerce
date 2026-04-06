import { ZodError } from "zod";

const validate = (schema) => async (req, res, next) => {
    try {
        const validatedData = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });

        if (validatedData.body) Object.assign(req.body, validatedData.body);
        if (validatedData.query) Object.assign(req.query, validatedData.query);
        if (validatedData.params) Object.assign(req.params, validatedData.params);

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(422).json({
                errors: error.issues.map((e) => ({
                    path: e.path.slice(1).join(".") || e.path[0],
                    message: e.message
                }))
            });
        }

        console.error("Middleware Error: ", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export default validate;