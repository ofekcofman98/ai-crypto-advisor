"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const feedback_schema_1 = require("./feedback.schema");
const feedback_service_1 = require("./feedback.service");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// ─── POST /api/feedback ────────────────────────────────────────────────────────
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const data = feedback_schema_1.voteSchema.parse(req.body);
    const feedback = await (0, feedback_service_1.registerFeedback)(userId, data);
    res.status(200).json({ message: 'Feedback registered successfully.', feedback });
}));
// ─── GET /api/feedback/my-votes ───────────────────────────────────────────────
router.get('/my-votes', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const votes = await (0, feedback_service_1.getUserVotes)(userId);
    res.status(200).json(votes);
}));
exports.default = router;
