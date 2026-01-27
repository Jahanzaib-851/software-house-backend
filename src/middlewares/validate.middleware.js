// backend/src/middlewares/validate.middleware.js
import { body, param, validationResult } from "express-validator";

const validate = (type) => {
  return async (req, res, next) => {
    switch (type) {
      case "generateReport":
        await body("reportType").notEmpty().run(req);
        await body("year").optional().isInt().run(req);
        break;

      case "getReports":
        // optional pagination validation
        break;

      case "getById":
        await param("id").isMongoId().run(req);
        break;

      case "updateReport":
        await body("reportType").optional().notEmpty().run(req);
        await body("year").optional().isInt().run(req);
        break;

      // add more validation types here
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    next(); // ✅ important
  };
};

export default validate; // ✅ make sure this line exists
