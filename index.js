"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sax = __importStar(require("sax"));
const theredoc = require('theredoc');
const DEFAULT_QUESTION_TYPE = 'multiple-choice';
function parse(contents, options = {}) {
    return new Promise((resolve, reject) => {
        const parser = sax.parser(false, {
            lowercase: true,
        });
        const groups = [];
        const seenIds = (options.existingIds || []).reduce((all, id) => {
            all[id] = true;
            return all;
        }, {});
        let current;
        let textTarget = null;
        const tagStack = [];
        parser.onopentag = (node) => {
            const currentTag = tagStack[tagStack.length - 1];
            if (node.name === 'root') {
                // Do nothing!
            }
            else if (node.name === 'group') {
                if (currentTag !== 'root') {
                    throw new InvalidChild(currentTag, node.name);
                }
                const name = node.attributes.name;
                if (!name) {
                    throw new OpenStandardParseError(`<group> requires a name attribute`);
                }
                groups.push({
                    name: name,
                    questions: [],
                });
            }
            else if (node.name === 'question') {
                if (currentTag !== 'group') {
                    throw new InvalidChild(currentTag, node.name);
                }
                const type = node.attributes.type || DEFAULT_QUESTION_TYPE;
                if (type !== 'multiple-choice' && type !== 'line-numbers' && type !== 'input') {
                    throw new OpenStandardParseError(`Invalid question type: ${type}`);
                }
                const id = node.attributes.id;
                if (seenIds[id]) {
                    throw new DuplicateId(id);
                }
                seenIds[id] = true;
                if (type === 'multiple-choice') {
                    current = {
                        id: id,
                        hasBody: false,
                        question: {
                            type: type,
                            id: id,
                            text: '',
                            choiceGroups: [],
                        }
                    };
                }
                else if (type === 'line-numbers') {
                    current = {
                        id: id,
                        hasBody: false,
                        question: {
                            type: type,
                            id: id,
                            text: '',
                            code: {
                                text: '',
                                answer: [],
                            }
                        }
                    };
                }
                else if (type === 'input') {
                    current = {
                        id: id,
                        hasBody: false,
                        question: {
                            type: type,
                            id: id,
                            text: '',
                            answer: { text: '' },
                        }
                    };
                }
                if (!current.id) {
                    throw new OpenStandardParseError(`Question id is required.`);
                }
                whitelistAttrs(['id', 'type'], 'question', current.id, Object.keys(node.attributes));
            }
            else if (node.name === 'body') {
                if (currentTag !== 'question') {
                    throw new InvalidChild(currentTag, node.name);
                }
                if (current.hasBody) {
                    throw new OpenStandardParseError(`Cannot have two body tags (question id=${current.id})`);
                }
                whitelistAttrs([], 'body', current.id, Object.keys(node.attributes));
                textTarget = current.question;
            }
            else if (node.name === 'choice-group') {
                if (currentTag !== 'question') {
                    throw new InvalidChild(currentTag, node.name);
                }
                if (current.question.type !== 'multiple-choice') {
                    throw new InvalidChildForQuestionType(current.id, current.question.type, 'choice-group');
                }
                whitelistAttrs(['name', 'label'], 'choice-group', current.id, Object.keys(node.attributes));
                current.question.choiceGroups.push({
                    name: node.attributes.name || 'default',
                    label: node.attributes.label || null,
                    choices: [],
                });
            }
            else if (node.name === 'choice') {
                if (currentTag !== 'choice-group') {
                    throw new InvalidChild(currentTag, node.name);
                }
                whitelistAttrs(['answer'], 'choice', current.id, Object.keys(node.attributes));
                if (current.question.type !== 'multiple-choice') {
                    throw new InvalidChildForQuestionType(current.id, current.question.type, node.name);
                }
                const cg = current.question.choiceGroups[current.question.choiceGroups.length - 1];
                cg.choices.push({
                    answer: 'answer' in node.attributes,
                    text: '',
                });
                textTarget = cg.choices[cg.choices.length - 1];
            }
            else if (node.name === 'code') {
                if (current.question.type !== 'line-numbers') {
                    throw new InvalidChildForQuestionType(current.id, current.question.type, node.name);
                }
                whitelistAttrs(['answer'], 'code', current.id, Object.keys(node.attributes));
                current.question.code.answer = (node.attributes.answer || '')
                    .split(',')
                    .map(val => Number(val.trim()))
                    .filter(x => x);
                if (current.question.code.answer.length === 0) {
                    throw new OpenStandardParseError(`<code> requires at least one answer`);
                }
                textTarget = current.question.code;
            }
            else if (node.name === 'answer') {
                if (current.question.type !== 'input') {
                    throw new InvalidChildForQuestionType(current.id, current.question.type, node.name);
                }
                whitelistAttrs([], 'answer', current.id, Object.keys(node.attributes));
                textTarget = current.question.answer;
            }
            else {
                throw new OpenStandardParseError(`Invalid tag: ${node.name}`);
            }
            tagStack.push(node.name);
        };
        parser.ontext = (text) => {
            if (textTarget) {
                textTarget.text += text;
            }
        };
        parser.onclosetag = (tagName) => {
            if (tagName === 'question') {
                if (!current.hasBody) {
                    throw new OpenStandardParseError(`Body is required (question id=${current.id})`);
                }
                const currentGroup = groups[groups.length - 1];
                currentGroup.questions.push(current.question);
            }
            if (tagName === 'choice-group' &&
                current.question.type === 'multiple-choice' &&
                current.question.choiceGroups.length >= 2 &&
                !current.question.choiceGroups.every(g => !!g.label)) {
                throw new ChoiceGroupLabelsError(current.id);
            }
            if (tagName === 'body') {
                current.hasBody = true;
            }
            if (textTarget && ['body', 'choice', 'code', 'answer'].includes(tagName)) {
                if (textTarget.text.indexOf('\t') >= 0) {
                    throw new OpenStandardParseError(`Please do not use tab characters in <${tagName}> (question id=${current.id})`);
                }
                textTarget.text = theredoc([textTarget.text], []);
                textTarget = null;
            }
            tagStack.pop();
        };
        parser.onerror = (e) => {
            reject(e);
        };
        parser.onend = () => {
            resolve(groups);
        };
        parser.write(`<root>${contents}</root>`).close();
    });
}
exports.parse = parse;
function whitelistAttrs(valid, tagName, id, attrs) {
    attrs.forEach(attr => {
        if (!valid.includes(attr)) {
            throw new InvalidAttribute(id, tagName, attr);
        }
    });
}
class OpenStandardParseError extends Error {
}
exports.OpenStandardParseError = OpenStandardParseError;
class DuplicateId extends OpenStandardParseError {
    constructor(id) {
        super(`Duplicate question id: "${id}"`);
        this.id = id;
    }
}
exports.DuplicateId = DuplicateId;
class ChoiceGroupLabelsError extends OpenStandardParseError {
    constructor(id) {
        super(`<choice-group> must have a label attribute when multiple are present (question id=${id})`);
        this.id = id;
    }
}
exports.ChoiceGroupLabelsError = ChoiceGroupLabelsError;
class InvalidAttribute extends OpenStandardParseError {
    constructor(id, tagName, attr) {
        const location = id ? ` (question id=${id})` : '';
        super(`Invalid ${tagName} attribute: '${attr}'${location}`);
        this.tagName = tagName;
    }
}
exports.InvalidAttribute = InvalidAttribute;
class InvalidChild extends OpenStandardParseError {
    constructor(parentTag, childTag) {
        super(`A <${childTag}> cannot be a child of <${parentTag}>`);
        this.parentTag = parentTag;
        this.childTag = childTag;
    }
}
exports.InvalidChild = InvalidChild;
class InvalidChildForQuestionType extends OpenStandardParseError {
    constructor(id, questionType, tagName) {
        super(`A <${tagName}> cannot be a child of a ${questionType} question (id=${id})`);
        this.questionType = questionType;
        this.tagName = tagName;
    }
}
exports.InvalidChildForQuestionType = InvalidChildForQuestionType;
