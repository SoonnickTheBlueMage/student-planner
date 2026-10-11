const modalState = {
    createType: 'subject',
    createSubjectId: null,
    currentTaskId: null,
    currentSubjectId: null,
    confirmCallback: null
};

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    if (document.activeElement) {
        document.activeElement.blur();
    }
}

document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
        closeModal(closeBtn.dataset.closeModal);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

document.getElementById('board').addEventListener('click', (e) => {
    const addTaskBtn = e.target.closest('[data-action="add-task"]');
    if (addTaskBtn) {
        e.stopPropagation();
        modalState.createType = 'task';
        modalState.createSubjectId = addTaskBtn.dataset.subjectId;
        document.getElementById('create-modal-title').textContent = 'Новая задача';
        document.getElementById('task-fields').classList.remove('task-fields-hidden');
        document.getElementById('create-form').reset();
        resetDatePicker('create');
        openModal('create-modal');
        return;
    }

    const checkbox = e.target.closest('[data-action="toggle-done"]');
    if (checkbox) {
        e.stopPropagation();
        const taskId = checkbox.dataset.taskId;
        const { task } = store.findTask(taskId);
        if (task) {
            store.updateTask(taskId, { done: !task.done });
            renderBoard();
        }
        return;
    }

    const taskContent = e.target.closest('[data-action="open-task"]');
    if (taskContent) {
        openTaskModal(taskContent.dataset.taskId);
        return;
    }

    const deleteTaskBtn = e.target.closest('[data-action="delete-task"]');
    if (deleteTaskBtn) {
        e.stopPropagation();
        const tId = deleteTaskBtn.dataset.taskId;
        const sId = deleteTaskBtn.dataset.subjectId;
        openConfirmModal('Удалить задачу', 'Вы уверены, что хотите удалить эту задачу?', () => {
            store.deleteTask(sId, tId);
            renderBoard();
        });
        return;
    }

    const deleteSubjectBtn = e.target.closest('[data-action="delete-subject"]');
    if (deleteSubjectBtn) {
        e.stopPropagation();
        const sId = deleteSubjectBtn.dataset.subjectId;
        openConfirmModal('Удалить предмет', 'Удалить предмет и все его задачи? Это действие нельзя отменить.', () => {
            store.deleteSubject(sId);
            renderBoard();
        });
        return;
    }
});

document.getElementById('add-subject-btn').addEventListener('click', () => {
    modalState.createType = 'subject';
    modalState.createSubjectId = null;
    document.getElementById('create-modal-title').textContent = 'Новый предмет';
    document.getElementById('task-fields').classList.add('task-fields-hidden');
    document.getElementById('create-form').reset();
    resetDatePicker('create');
    openModal('create-modal');
});

document.getElementById('create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('create-title').value.trim();
    if (!title) return;

    if (modalState.createType === 'subject') {
        store.addSubject(title);
    } else {
        const deadline = document.getElementById('create-deadline').value;
        const tagsInput = document.getElementById('create-tags').value;
        const tagNames = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        const tags = [];
        tagNames.forEach(name => {
            const tag = store.addTag(name);
            if (tag) tags.push(tag.name);
        });
        store.addTask(modalState.createSubjectId, { title, deadline, tags });
    }

    closeModal('create-modal');
    renderBoard();
});

function openConfirmModal(title, message, onConfirm) {
    modalState.confirmCallback = onConfirm;
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    openModal('confirm-modal');
}

document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    modalState.confirmCallback = null;
    closeModal('confirm-modal');
});

document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    closeModal('confirm-modal');
    if (typeof modalState.confirmCallback === 'function') {
        modalState.confirmCallback();
    }
    modalState.confirmCallback = null;
});

function openTaskModal(taskId) {
    const { subject, task } = store.findTask(taskId);
    if (!task || !subject) return;

    modalState.currentTaskId = taskId;
    modalState.currentSubjectId = subject.id;

    document.getElementById('modal-task-title').textContent = task.title;
    document.getElementById('modal-tags-input').value = (task.tags || []).join(', ');
    document.getElementById('modal-done-checkbox').checked = task.done || false;
    document.getElementById('task-note-textarea').value = task.note || '';

    const dateInput = document.getElementById('modal-deadline-input');
    dateInput.value = task.deadline || '';
    updateDateDisplay('task', task.deadline);

    openModal('task-modal');
}

document.getElementById('save-task-btn').addEventListener('click', () => {
    if (!modalState.currentTaskId) return;

    const deadline = document.getElementById('modal-deadline-input').value;
    const tagsInput = document.getElementById('modal-tags-input').value;
    const done = document.getElementById('modal-done-checkbox').checked;
    const note = document.getElementById('task-note-textarea').value;

    const tagNames = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    const tags = [];
    tagNames.forEach(name => {
        const tag = store.addTag(name);
        if (tag) tags.push(tag.name);
    });

    store.updateTask(modalState.currentTaskId, {
        deadline: deadline,
        tags: tags,
        done: done,
        note: note
    });

    closeModal('task-modal');
    renderBoard();
});

function initDatePicker(prefix) {
    const btn = document.getElementById(`${prefix}-date-picker-btn`);
    const input = document.getElementById(prefix === 'create' ? 'create-deadline' : 'modal-deadline-input');
    const clearBtn = document.getElementById(`${prefix}-date-clear-btn`);

    btn.addEventListener('click', () => {
        input.showPicker();
    });

    input.addEventListener('change', () => {
        updateDateDisplay(prefix, input.value);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        updateDateDisplay(prefix, '');
    });
}

function updateDateDisplay(prefix, dateValue) {
    const btnText = document.getElementById(`${prefix}-date-btn-text`);
    const clearBtn = document.getElementById(`${prefix}-date-clear-btn`);

    if (dateValue) {
        btnText.textContent = formatDate(dateValue);
        clearBtn.style.display = 'inline';
    } else {
        btnText.textContent = 'Выбрать дату';
        clearBtn.style.display = 'none';
    }
}

function resetDatePicker(prefix) {
    const input = document.getElementById(prefix === 'create' ? 'create-deadline' : 'modal-deadline-input');
    input.value = '';
    updateDateDisplay(prefix, '');
}

initDatePicker('create');
initDatePicker('task');

function openSuccessModal(message) {
    document.getElementById('success-modal-message').textContent = message;
    openModal('success-modal');
}

document.getElementById('success-ok-btn').addEventListener('click', () => {
    closeModal('success-modal');
});
