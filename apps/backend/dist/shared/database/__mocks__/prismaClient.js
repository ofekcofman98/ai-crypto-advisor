"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.prismaMock = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
// Satisfies the `{ prisma }` named export consumed by all service modules.
exports.prisma = exports.prismaMock;
beforeEach(() => {
    (0, jest_mock_extended_1.mockReset)(exports.prismaMock);
});
