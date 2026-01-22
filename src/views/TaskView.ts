import type { Task } from "../models/Task.ts";
import { TaskStatus } from "../utils/TaskStatus.ts";

export class TaskView {
    private toDoElement: HTMLDivElement;
    private doingElement: HTMLDivElement;
    private doneElement: HTMLDivElement;
    private taskModal: HTMLDivElement;

    constructor() {
        this.toDoElement = document.querySelector(".todo-list") as HTMLDivElement;
        this.doingElement = document.querySelector(".doing-list") as HTMLDivElement;
        this.doneElement = document.querySelector(".done-list") as HTMLDivElement;
        this.taskModal = document.querySelector("#task-modal") as HTMLDivElement;
    }

    private getBorderColor(status: TaskStatus): string {
        switch (status) {
            case 'todo': return 'border-blue-500';
            case 'doing': return 'border-yellow-500';
            case 'done': return 'border-green-500';
            default: return 'border-gray-500';
        }
    }

    private renderTask(task: Task): void {
        const taskDiv = document.createElement("div");
        let parentDiv: HTMLDivElement;
        const date = new Date(task.createdAt);

        switch (task.status) {
            case TaskStatus.DOING:
                parentDiv = this.doingElement;
                break;
            case TaskStatus.TODO:
                parentDiv = this.toDoElement;
                break;
            case TaskStatus.DONE:
                parentDiv = this.doneElement;
                break;
        }

        taskDiv.innerHTML = `
                <div class="task bg-white p-4 rounded-lg shadow-sm border-l-4 ${this.getBorderColor(task.status)} cursor-grab hover:bg-gray-650 transition active:cursor-grabbing" draggable="true" data-id="${task.id}">
                    <h3 class="title font-semibold text-black">${task.title}</h3>
                    <p class="description text-black text-md mt-2">${task.description}</p>
                    <p class="date-created text-gray-400 text-sm mt-2 text-right">${date.toLocaleDateString()}</p>
                </div>
                `;

        parentDiv.appendChild(taskDiv);
    }

    renderAll(tasks: Task[]) {
        this.clearAll();

        tasks.forEach(task => {
            this.renderTask(task);
        });
    }

    clearAll(): void {
        this.toDoElement.innerHTML = "";
        this.doingElement.innerHTML = "";
        this.doneElement.innerHTML = "";
    }

    showModal(): void {
       this.taskModal.classList.remove("hidden")
    }

    hideModal(): void {
        this.taskModal.classList.add("hidden")
    }

    isChildOfTaskModal(element: HTMLElement): boolean {
        return this.taskModal.contains(element);
    }
}