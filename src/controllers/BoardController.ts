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
    private mainContainer: HTMLElement;
    private scrollInterval: number | null = null;
    private isDragging: boolean = false;
    private currentDragPosition: { x: number; y: number } | null = null;
    private touchMoveHandler: ((e: TouchEvent) => void) | null = null;

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
        this.mainContainer = document.querySelector("main")!;

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

        const closeModal = () => {
            this.view.hideModal();
            this.titleInput.value = "";
            this.descriptionInput.value = "";
        }

        this.closeModalBtn.addEventListener("click", closeModal);

        this.cancelBtn.addEventListener("click", closeModal);

        document.addEventListener("keydown", (evt) => {
            if (evt.key === "Escape") {
                this.view.hideModal();
            }
        });
    }

    private attachFormListeners(): void {
        this.createTaskForm.addEventListener("submit", (evt) => {
            evt.preventDefault();

            const title = this.titleInput.value.trim();
            const description = this.descriptionInput.value.trim();

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
                this.isDragging = true;

                setTimeout(() => {
                    (event.target as HTMLElement).classList.add("opacity-50");
                }, 0);

                this.startAutoScroll();

                this.touchMoveHandler = (e: TouchEvent) => {
                    if (e.touches.length > 0) {
                        this.currentDragPosition = {
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY
                        };
                        this.handleAutoScrollFromPosition();
                    }
                };
                document.addEventListener("touchmove", this.touchMoveHandler, { passive: true });
            });

            card.addEventListener("dragend", (event: any) => {
                (event.target as HTMLElement).classList.remove("opacity-50");
                this.isDragging = false;
                this.currentDragPosition = null;
                this.stopAutoScroll();
                
                if (this.touchMoveHandler) {
                    document.removeEventListener("touchmove", this.touchMoveHandler);
                    this.touchMoveHandler = null;
                }
            });

            card.addEventListener("drag", (event: Event) => {
                if (this.isDragging) {
                    this.handleAutoScroll(event as DragEvent);
                }
            });
        });
    }

    private startAutoScroll(): void {
        this.stopAutoScroll();
    }

    private stopAutoScroll(): void {
        if (this.scrollInterval !== null) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }

    private handleAutoScroll(event: DragEvent): void {
        let clientX = event.clientX;
        let clientY = event.clientY;

        if ((clientX === 0 && clientY === 0) || (clientX === undefined || clientY === undefined)) {
            if (this.currentDragPosition) {
                clientX = this.currentDragPosition.x;
                clientY = this.currentDragPosition.y;
            } else {
                return;
            }
        }

        this.handleAutoScrollFromPosition(clientX, clientY);
    }

    private handleAutoScrollFromPosition(clientX?: number, clientY?: number): void {
        const edgeThreshold = 150;
        const scrollSpeed = 10;
        const scrollIntervalMs = 16;

        let x = clientX;
        let y = clientY;

        if (x === undefined || y === undefined) {
            if (this.currentDragPosition) {
                x = this.currentDragPosition.x;
                y = this.currentDragPosition.y;
            } else {
                return;
            }
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const isNearLeftEdge = x < edgeThreshold;
        const isNearRightEdge = x > viewportWidth - edgeThreshold;

        const isNearTopEdge = y < edgeThreshold;
        const isNearBottomEdge = y > viewportHeight - edgeThreshold;

        this.stopAutoScroll();

        const scrollableContainers: { element: HTMLElement; scrollX: number; scrollY: number }[] = [];

        if (isNearLeftEdge || isNearRightEdge) {
            const scrollX = isNearLeftEdge ? -scrollSpeed : scrollSpeed;
            scrollableContainers.push({
                element: this.mainContainer,
                scrollX: scrollX,
                scrollY: 0
            });
        }

        if (isNearTopEdge || isNearBottomEdge) {
            const scrollY = isNearTopEdge ? -scrollSpeed : scrollSpeed;
            
            const columnLists = [
                document.querySelector(".todo-list") as HTMLElement,
                document.querySelector(".doing-list") as HTMLElement,
                document.querySelector(".done-list") as HTMLElement
            ];

            columnLists.forEach(list => {
                if (list) {
                    const rect = list.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right) {
                        scrollableContainers.push({
                            element: list,
                            scrollX: 0,
                            scrollY: scrollY
                        });
                    }
                }
            });

            scrollableContainers.push({
                element: this.mainContainer,
                scrollX: 0,
                scrollY: scrollY
            });
        }

        if (scrollableContainers.length > 0) {
            this.scrollInterval = window.setInterval(() => {
                scrollableContainers.forEach(({ element, scrollX, scrollY }) => {
                    if (scrollX !== 0) {
                        const maxScrollX = element.scrollWidth - element.clientWidth;
                        const newScrollX = Math.max(0, Math.min(maxScrollX, element.scrollLeft + scrollX));
                        if (newScrollX !== element.scrollLeft) {
                            element.scrollLeft = newScrollX;
                        }
                    }
                    if (scrollY !== 0) {
                        const maxScrollY = element.scrollHeight - element.clientHeight;
                        const newScrollY = Math.max(0, Math.min(maxScrollY, element.scrollTop + scrollY));
                        if (newScrollY !== element.scrollTop) {
                            element.scrollTop = newScrollY;
                        }
                    }
                });
            }, scrollIntervalMs);
        }
    }
}