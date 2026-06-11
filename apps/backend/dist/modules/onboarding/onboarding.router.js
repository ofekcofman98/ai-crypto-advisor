"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const onboarding_schema_1 = require("./onboarding.schema");
const onboarding_service_1 = require("./onboarding.service");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const data = onboarding_schema_1.onboardingSchema.parse(req.body);
    const updatedPreference = await (0, onboarding_service_1.saveUserOnboarding)(userId, data);
    res.status(200).json({ preference: updatedPreference });
}));
exports.default = router;
