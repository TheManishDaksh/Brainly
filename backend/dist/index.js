"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("./db");
const middleware_1 = __importDefault(require("./middleware"));
const hashGenerator_1 = __importDefault(require("./hashGenerator"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
dotenv_1.default.config();
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, name } = req.body;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    console.log(hashedPassword);
    try {
        const user = yield db_1.UserModel.create({
            username,
            password: hashedPassword,
            name
        });
        res.json({
            message: "user signed up"
        });
    }
    catch (error) {
        res.status(403).json({
            message: "user already exist"
        });
    }
}));
app.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield db_1.UserModel.findOne({ username });
        if (!user) {
            res.status(403).json({
                message: "User not found please signup first"
            });
            return;
        }
        const comparePassword = bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.password);
        if (!comparePassword) {
            res.status(403).json({
                message: "password is incorrect"
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        const token = jsonwebtoken_1.default.sign({
            id: user === null || user === void 0 ? void 0 : user._id
        }, jwtSecret);
        res.json({
            token
        });
    }
    catch (error) {
        res.status(411).json({
            message: "incorrect credentials"
        });
    }
}));
app.post("/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, link, type } = req.body;
    try {
        const content = yield db_1.contentModel.create({
            title,
            type,
            link,
            tags: [],
            //@ts-ignore
            userId: req.userId
        });
        res.json({
            content
        });
    }
    catch (error) {
        res.status(403).json({
            message: "content is not created"
        });
    }
}));
app.get("/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const content = yield db_1.contentModel.find({
            userId
        });
        res.json({
            content
        });
    }
    catch (error) {
        res.status(403).json({
            message: "user not found"
        });
    }
}));
app.delete("/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const contentId = req.body.contentId;
    try {
        yield db_1.contentModel.deleteOne({
            userId,
            contentId
        });
        res.json({
            message: "deleted"
        });
    }
    catch (error) {
        res.status(411).json({
            message: "can't be deleted"
        });
    }
}));
app.post("/brain/share", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    try {
        if (share) {
            const existingShare = yield db_1.linkModel.findOne({
                //@ts-ignore
                userId: req.userId,
            });
            if (existingShare) {
                res.json({
                    haash: existingShare.hash
                });
                return;
            }
            try {
                const hash = (0, hashGenerator_1.default)(10);
                yield db_1.linkModel.create({
                    //@ts-ignore
                    userId: req.userId,
                    hash: hash
                });
                res.json({
                    hash
                });
            }
            catch (error) {
                res.status(403).json({
                    message: "hash can't be generated"
                });
            }
        }
        else {
            yield db_1.linkModel.deleteOne({
                //@ts-ignore
                userId: req.userId
            });
            res.json({
                message: "link removed"
            });
        }
    }
    catch (error) {
        res.status(403).json({
            message: "something went wrong with sharelink"
        });
    }
}));
app.get("/:share", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.share;
    try {
        const link = yield db_1.linkModel.findOne({
            hash
        });
        if (!link) {
            res.status(403).json({
                message: "link does not found"
            });
        }
        const user = yield db_1.UserModel.findOne({
            _id: link === null || link === void 0 ? void 0 : link.userId
        });
        const content = yield db_1.contentModel.findOne({
            userId: link === null || link === void 0 ? void 0 : link.userId
        });
        res.json({
            username: user === null || user === void 0 ? void 0 : user.username,
            content: content
        });
    }
    catch (error) {
        res.status(411).json({
            message: "link is not valid"
        });
    }
}));
app.listen(3000);
