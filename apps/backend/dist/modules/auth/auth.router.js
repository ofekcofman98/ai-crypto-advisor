"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post('/register', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = auth_schema_1.registerSchema.parse(req.body);
    const result = await (0, auth_service_1.registerUser)(validatedData);
    res.status(201).json(result);
}));
router.post('/login', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = auth_schema_1.loginSchema.parse(req.body);
    const result = await (0, auth_service_1.loginUser)(validatedData);
    res.status(200).json(result);
}));
exports.default = router;
