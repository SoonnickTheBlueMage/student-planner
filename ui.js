function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function getTagColor(tagName) {
    const tag = store.getTag(tagName);
    return tag ? tag.color : '#999999';
}

function getContrastColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? '#333333' : '#ffffff';
}

function getDeadlineInfo(dateString) {
    if (!dateString) return null;

    const deadline = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const dateStr = formatDate(dateString);

    if (diffDays < 0) {
        return {
            text: '⚠️ Дедлайн прошёл ' + dateStr,
            className: 'deadline-overdue'
        };
    } else if (diffDays === 0) {
        return { text: '🔥 Дедлайн сегодня! (' + dateStr + ')', className: 'deadline-today' };
    } else if (diffDays === 1) {
        return { text: '⏰ Дедлайн завтра (' + dateStr + ')', className: 'deadline-today' };
    } else if (diffDays <= 3) {
        return {
            text: '📅 ' + diffDays + ' ' + pluralDays(diffDays) + ' до дедлайна (' + dateStr + ')',
            className: 'deadline-soon'
        };
    } else {
        return {
            text: '📅 ' + diffDays + ' ' + pluralDays(diffDays) + ' до дедлайна (' + dateStr + ')',
            className: 'deadline-normal'
        };
    }
}

function pluralDays(n) {
    const abs = Math.abs(n) % 100;
    const lastDigit = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (lastDigit > 1 && lastDigit < 5) return 'дня';
    if (lastDigit === 1) return 'день';
    return 'дней';
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    if (store.data.subjects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<p>Пока нет предметов.<br>Нажмите «+ Предмет», чтобы начать!</p>';
        board.appendChild(emptyState);
        return;
    }

    store.data.subjects.forEach(subject => {
        const subjectBlock = document.createElement('div');
        subjectBlock.className = 'subject-block';

        const header = document.createElement('div');
        header.className = 'subject-header';
        header.innerHTML = `
            <div class="subject-header-left">
                <span class="subject-name">${escapeHtml(subject.name)}</span>
                <button class="btn-delete" data-action="delete-subject" data-subject-id="${subject.id}" title="Удалить предмет">×</button>
            </div>
            <button class="btn btn-primary" data-action="add-task" data-subject-id="${subject.id}">+ Задача</button>
        `;
        subjectBlock.appendChild(header);

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'subject-tasks';
        tasksContainer.dataset.subjectId = subject.id;

        subject.tasks.forEach(task => {
            tasksContainer.appendChild(createTaskCard(task, subject.id));
        });

        subjectBlock.appendChild(tasksContainer);
        board.appendChild(subjectBlock);
    });

    initSortable();
}

function createTaskCard(task, subjectId) {
    const card = document.createElement('div');
    card.className = 'task-card' + (task.done ? ' task-done' : '');
    card.dataset.taskId = task.id;

    let tagsHtml = '';
    if (task.tags && task.tags.length > 0) {
        tagsHtml = '<div class="tags-container">' +
        task.tags.map(tagName => {
            const color = getTagColor(tagName);
            const textColor = getContrastColor(color);
            return `<span class="tag" style="background:${color};color:${textColor};">${escapeHtml(tagName)}</span>`;
        }).join('') +
        '</div>';
    }

    let deadlineHtml = '';
    const deadlineInfo = getDeadlineInfo(task.deadline);
    if (deadlineInfo) {
        deadlineHtml = `<div class="task-deadline-info ${deadlineInfo.className}">${deadlineInfo.text}</div>`;
    }

    let notePreview = '';
    if (task.note && task.note.trim()) {
        const text = task.note.trim();
        const preview = text.length > 60 ? text.substring(0, 60) + '...' : text;
        notePreview = `<div class="task-note-preview">📝 ${escapeHtml(preview)}</div>`;
    }

    card.innerHTML = `
        <div class="task-card-inner">
            <input type="checkbox" class="task-checkbox" data-action="toggle-done" data-task-id="${task.id}" ${task.done ? 'checked' : ''} title="Отметить как выполненную">
            <div class="task-content" data-action="open-task" data-task-id="${task.id}">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${deadlineHtml}
                ${tagsHtml}
                ${notePreview}
            </div>
            <button class="btn-delete" data-action="delete-task" data-task-id="${task.id}" data-subject-id="${subjectId}" title="Удалить задачу">×</button>
        </div>
    `;

    return card;
}

function initSortable() {
    document.querySelectorAll('.subject-tasks').forEach(container => {
        new Sortable(container, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            chosenClass: 'sortable-chosen',
            filter: '.task-checkbox, .btn-delete',
            preventOnFilter: false,
            forceFallback: true,
            fallbackOnBody: true,
            onEnd: function(evt) {
                const subjectId = container.dataset.subjectId;
                const taskId = evt.item.dataset.taskId;
                if (taskId && evt.newIndex !== evt.oldIndex) {
                    store.moveTask(subjectId, taskId, evt.newIndex);
                }
            }
        });
    });
}
