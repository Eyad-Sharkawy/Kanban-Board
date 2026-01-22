import type { Subject, Observer } from "../utils/Observer.ts";
import type { Task } from "../models/Task.ts";
import { StorageService } from "./SorageService.ts"
import type { TaskStatus } from "../utils/TaskStatus.ts";

export class TaskService implements Subject {
  private observers: Observer[] = [];
  private tasksArray: Task[];
  private readonly STORAGE_KEY = "kanban-tasks-v1";
  private storage: StorageService;

  private save(): void {
      this.storage.save(this.STORAGE_KEY, this.tasksArray);
  }

  constructor() {
      this.storage = new StorageService;
      this.tasksArray = this.storage.load<Task[]>(this.STORAGE_KEY) || [];
  }

  addTask(title: string, description: string, status: TaskStatus) {
      const newTask: Task = {
          id: Date.now(),
          title: title,
          description: description,
          status: status,
          createdAt: Date.now()
      };

      this.tasksArray.push(newTask);

      this.save()

      this.notify();
  }

  deleteTask(id: number): void {
      const index = this.tasksArray.findIndex(task => task.id === id);

      if (index !== -1) {
          this.tasksArray.splice(index, 1);
          this.save();
          this.notify();
      }
  }

  clearTasks(): void {
      this.tasksArray = [];
      this.save();
      this.notify();
  }

  getAllTasks(): Task[] {
      return [...this.tasksArray];
  }

  moveTask(id: number, newStatus: TaskStatus): void {
      const index = this.tasksArray.findIndex(task => task.id === id);

      if (index !== -1) {
          const task = this.tasksArray[index];

          task.status = newStatus;

          this.save();
          this.notify();
      }
  }

  attach(observer: Observer): void {
      const ifExist = this.observers.includes(observer);

      if (!ifExist) {
         this.observers.push(observer);
      }
  }

  detach(observer: Observer): void {
      const observerIndex = this.observers.indexOf(observer);

      if (observerIndex !== -1) {
          this.observers.splice(observerIndex, 1);
      }
  }

  notify(): void {
      for (const observer of this.observers) {
          observer.update(this.tasksArray);
      }
  }

};