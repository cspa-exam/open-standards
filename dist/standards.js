"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("./parser");
function parseStandards() {
    return __awaiter(this, void 0, void 0, function* () {
        const standardsDir = path.resolve(__dirname, '../standards');
        const dirs = (yield readDir(standardsDir))
            .filter(file => fs.statSync(`${standardsDir}/${file}`).isDirectory());
        return Promise.all(dirs.map((dir) => __awaiter(this, void 0, void 0, function* () {
            const questionFiles = (yield readDir(`${standardsDir}/${dirs[0]}`))
                .filter(file => file.match(/\.xml/));
            var sections = yield Promise.all(questionFiles.map((file) => __awaiter(this, void 0, void 0, function* () {
                const [, sectionName] = file.match(/^(.*)\.xml$/);
                const content = yield readFile(`${standardsDir}/${dir}/${file}`);
                return {
                    name: sectionName,
                    questionGroups: yield parser_1.parse(content)
                };
            })));
            return {
                name: dir,
                sections: sections,
            };
        })));
    });
}
exports.parseStandards = parseStandards;
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: 'utf8' }, (err, content) => {
            if (err)
                return reject(err);
            resolve(content);
        });
    });
}
function readDir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, { encoding: 'utf8' }, (err, files) => {
            if (err)
                return reject(err);
            resolve(files);
        });
    });
}
