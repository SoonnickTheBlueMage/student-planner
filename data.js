class AppData {
    constructor() {
        this.data = this.load();
    }

    load() {
        const saved = localStorage.getItem('student_planner_data_v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (!data.tags) data.tags = [];
                if (!data.subjects) data.subjects = [];
                data.subjects.forEach(subject => {
                    if (!subject.tasks) subject.tasks = [];
                    subject.tasks.forEach(task => {
                        if (!task.tags) task.tags = [];
                        if (task.note === undefined) task.note = '';
                        if (task.done === undefined) task.done = false;
                        if (task.notes && Array.isArray(task.notes)) {
                            if (task.notes.length > 0 && !task.note) {
                                task.note = task.notes[0].text || '';
                            }
                            delete task.notes;
                        }
                    });
                });
                return data;
            } catch (e) {
                console.error('Ошибка чтения localStorage:', e);
            }
        }
        return { subjects: [], tags: [] };
    }

    save() {
        localStorage.setItem('student_planner_data_v2', JSON.stringify(this.data));
    }

    addSubject(name) {
        const subject = {
            id: 'subj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            tasks: []
        };
        this.data.subjects.push(subject);
        this.save();
        return subject;
    }

    deleteSubject(subjectId) {
        this.data.subjects = this.data.subjects.filter(s => s.id !== subjectId);
        this.save();
    }

    addTask(subjectId, taskData) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (!subject) return null;

        const task = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: taskData.title,
            deadline: taskData.deadline || '',
            tags: taskData.tags || [],
            note: '',
            done: false
        };
        subject.tasks.push(task);
        this.save();
        return task;
    }

    deleteTask(subjectId, taskId) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (subject) {
            subject.tasks = subject.tasks.filter(t => t.id !== taskId);
            this.save();
        }
    }

    moveTask(subjectId, taskId, newIndex) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (!subject) return false;

        const oldIndex = subject.tasks.findIndex(t => t.id === taskId);
        if (oldIndex === -1) return false;

        const [task] = subject.tasks.splice(oldIndex, 1);
        subject.tasks.splice(newIndex, 0, task);
        this.save();
        return true;
    }

    updateTask(taskId, updates) {
        const { task } = this.findTask(taskId);
        if (!task) return false;

        if (updates.deadline !== undefined) task.deadline = updates.deadline;
        if (updates.tags !== undefined) task.tags = updates.tags;
        if (updates.done !== undefined) task.done = updates.done;
        if (updates.note !== undefined) task.note = updates.note;

        this.save();
        return true;
    }

    findTask(taskId) {
        for (const subject of this.data.subjects) {
            const task = subject.tasks.find(t => t.id === taskId);
            if (task) return { subject, task };
        }
        return { subject: null, task: null };
    }

    addTag(name) {
        const normalized = name.trim().toLowerCase();
        if (!normalized) return null;

        const existing = this.data.tags.find(t => t.name === normalized);
        if (existing) return existing;

        const tag = {
            id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: normalized,
            color: this.generateColor()
        };
        this.data.tags.push(tag);
        this.save();
        return tag;
    }

    getTag(name) {
        const normalized = (name || '').trim().toLowerCase();
        return this.data.tags.find(t => t.name === normalized);
    }

    generateColor() {
        const palette = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
            '#E76F51', '#2A9D8F', '#264653', '#E9C46A', '#F4A261'
        ];
        return palette[Math.floor(Math.random() * palette.length)];
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed || !Array.isArray(parsed.subjects)) return false;

            this.data = parsed;
            if (!this.data.tags) this.data.tags = [];
            this.data.subjects.forEach(subject => {
                if (!subject.tasks) subject.tasks = [];
                subject.tasks.forEach(task => {
                    if (!task.tags) task.tags = [];
                    if (task.note === undefined) task.note = '';
                    if (task.done === undefined) task.done = false;
                });
            });
            this.save();
            return true;
        } catch (e) {
            console.error('Ошибка импорта:', e);
            return false;
        }
    }
}

const store = new AppData();
