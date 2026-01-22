export interface Observer {
    update(date: any): void;
}

export interface Subject {
    attach(observer: Observer): void;

    detach(observer: Observer): void;

    notify(): void;
}