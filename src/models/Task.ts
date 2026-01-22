import {TaskStatus} from "../utils/TaskStatus.ts";

export type Task = {
    id: number,
    title: string,
    description: string,
    status: TaskStatus,
    createdAt: number
};