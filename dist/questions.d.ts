export declare function getQuestions(): Promise<{
    subject: string;
    sections: {
        section: string;
        questionGroups: import("./parser").Group[];
    }[];
}[]>;
