document.getElementById('export-btn').addEventListener('click', () => {
    const dataStr = store.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_planner_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

const fileInput = document.getElementById('file-input');

document.getElementById('import-btn').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (store.importData(event.target.result)) {
            renderBoard();
            openSuccessModal('Расписание успешно загружено из файла!');
        } else {
            openSuccessModal('Ошибка: неверный формат файла. Проверьте, что это JSON.');
        }
    };
    reader.readAsText(file);
    fileInput.value = '';
});

renderBoard();
console.log('✅ Приложение запущено');
