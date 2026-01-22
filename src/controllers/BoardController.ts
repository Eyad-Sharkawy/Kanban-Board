import {TaskView} from "../views/TaskView.ts";
import {TaskService} from "../services/TaskService.ts";
import {TaskStatus} from "../utils/TaskStatus.ts";
import type {Observer} from "../utils/Observer.ts";
import type {Task} from "../models/Task.ts";

export class BoardController implements Observer {
    private model: TaskService;
    private view: TaskView;

    private addTaskBtn: HTMLButtonElement;
    private closeModalBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private createTaskForm: HTMLFormElement;
    private titleInput: HTMLInputElement;
    private descriptionInput: HTMLTextAreaElement;

    private todoColumn: HTMLElement;
    private doingColumn: HTMLElement;
    private doneColumn: HTMLElement;

    constructor(model: TaskService, view: TaskView) {
        this.model = model;
        this.view = view;

        this.addTaskBtn = document.querySelector(".add-task-btn") as HTMLButtonElement;
        this.closeModalBtn = document.querySelector("#close-modal-btn") as HTMLButtonElement;
        this.cancelBtn = document.querySelector("#cancel-btn") as HTMLButtonElement;
        this.createTaskForm = document.querySelector("#add-task-form") as HTMLFormElement;
        this.titleInput = document.querySelector("#task-title-input") as HTMLInputElement;
        this.descriptionInput = document.querySelector("#task-desc-input") as HTMLTextAreaElement;

        this.todoColumn = document.getElementById("col-todo")!;
        this.doingColumn = document.getElementById("col-doing")!;
        this.doneColumn = document.getElementById("col-done")!;


        this.model.attach(this);

        this.attachModalListeners();
        this.attachFormListeners();
        this.attachColumnDropListeners();

        this.update(this.model.getAllTasks());
    }

    update(date: Task[]) {
        this.view.renderAll(date);

        this.attachDragStartListeners();
    }

    private attachModalListeners(): void {
        this.addTaskBtn.addEventListener("click", () => this.view.showModal());

        const modal = document.getElementById("task-modal") as HTMLDivElement;

        modal.addEventListener("click", (evt) => {
            const target = evt.target as HTMLElement;
            if (target === modal) {
                this.view.hideModal();
            }
        });

        this.closeModalBtn.addEventListener("click", () => this.view.hideModal());

        this.cancelBtn.addEventListener("click", () => this.view.hideModal());

        document.addEventListener("keydown", (evt) => {
            if (evt.key === "Escape") {
                this.view.hideModal();
            }
        });
    }

    private attachFormListeners(): void {
        this.createTaskForm.addEventListener("submit", (evt) => {
            evt.preventDefault();

            const title = this.titleInput.value;
            const description = this.descriptionInput.value;

            if (!title || !description) return;

            this.model.addTask(title, description, TaskStatus.TODO);

            this.cancelBtn.click();
        });

    }

    private attachColumnDropListeners(): void {
        const columns = [this.todoColumn, this.doingColumn, this.doneColumn];

        columns.forEach(column => {
            column.addEventListener("dragover", (event) => {
                event.preventDefault();
            });

            column.addEventListener("dragleave", () => {
                column.classList.remove("bg-gray-700");
            });

            column.addEventListener("drop", (event) => {
                event.preventDefault();
                column.classList.remove("bg-gray-700");

                const taskIdString = event.dataTransfer?.getData("text/plain");
                if (!taskIdString) return;
                const taskId = parseInt(taskIdString);

                let newStatus: TaskStatus;
                if (column === this.todoColumn) newStatus = TaskStatus.TODO;
                else if (column === this.doingColumn) newStatus = TaskStatus.DOING;
                else newStatus = TaskStatus.DONE;

                this.model.moveTask(taskId, newStatus);
            });
        });
    }

    private attachDragStartListeners(): void {
        const cards = document.querySelectorAll(".task");

        cards.forEach(card => {
            card.addEventListener("dragstart", (event: any) => {
                const id = event.target.dataset.id;
                event.dataTransfer.setData("text/plain", id);

                setTimeout(() => {
                    (event.target as HTMLElement).classList.add("opacity-50");
                }, 0);
            });

            card.addEventListener("dragend", (event: any) => {
                (event.target as HTMLElement).classList.remove("opacity-50");
            });
        });
    }
}