export declare type QuestionGroup = {
    name: string;
    questions: Question[];
};
declare type common = {
    id: string;
    text: string;
};
export declare type MultiChoiceQuestion = common & {
    type: 'multiple-choice';
    choiceGroups: ChoiceGroup[];
};
export declare type ChoiceGroup = {
    name: string;
    label: string | null;
    choices: Choice[];
};
export declare type Choice = {
    text: string;
    answer: boolean;
};
export declare type LineNumbersQuestion = common & {
    type: 'line-numbers';
    code: {
        text: string;
        answer: number[];
    };
};
export declare type InputQuestion = common & {
    type: 'input';
    answer: {
        text: string;
    };
};
export declare type Question = MultiChoiceQuestion | LineNumbersQuestion | InputQuestion;
export declare type QuestionType = Question['type'];
declare type ParseOptions = {
    existingIds?: string[];
};
export declare function parse(contents: string, options?: ParseOptions): Promise<QuestionGroup[]>;
export declare class OpenStandardParseError extends Error {
}
export declare class DuplicateId extends OpenStandardParseError {
    id: string;
    constructor(id: string);
}
export declare class ChoiceGroupLabelsError extends OpenStandardParseError {
    id: string;
    constructor(id: string);
}
export declare class InvalidAttribute extends OpenStandardParseError {
    tagName: string;
    constructor(id: string | null, tagName: string, attr: string);
}
export declare class InvalidChild extends OpenStandardParseError {
    parentTag: string;
    childTag: string;
    constructor(parentTag: string, childTag: string);
}
export declare class InvalidChildForQuestionType extends OpenStandardParseError {
    questionType: string;
    tagName: string;
    constructor(id: string, questionType: string, tagName: string);
}
export {};
