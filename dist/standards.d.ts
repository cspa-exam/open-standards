import { QuestionGroup } from './parser';
export declare type Standard = {
    name: string;
    sections: Section[];
};
export declare type Section = {
    name: string;
    questionGroups: QuestionGroup[];
};
export declare function parseStandards(): Promise<{
    name: string;
    sections: {
        name: string;
        questionGroups: QuestionGroup[];
    }[];
}[]>;
