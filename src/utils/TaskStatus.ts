export const TaskStatus = {
    TODO: "todo",
    DOING: "doing",
    DONE: "done"
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];