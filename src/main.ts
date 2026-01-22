import './style.css';

import {TaskService} from "./services/TaskService";
import {TaskView} from "./views/TaskView.ts";
import {BoardController} from "./controllers/BoardController.ts";

document.addEventListener("DOMContentLoaded", () => {
    try {
        const model = new TaskService();

        const view = new TaskView();

        // @ts-ignore
        const controller = new BoardController(model, view);
    } catch (error) {
        console.error('failed to initialize:', error);
    }
});