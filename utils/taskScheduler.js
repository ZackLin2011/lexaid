const taskScheduler = {
    formatDateTime: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16).replace('T', ' ');
    },

    toDateString: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    isOverdue: (task, now = new Date()) => {
        return !task.isLongTerm && !task.completed && task.dueDate && new Date(task.dueDate) < now;
    },

    isDueToday: (task, now = new Date()) => {
        if (task.isLongTerm || !task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getFullYear() === now.getFullYear() &&
               taskDate.getMonth() === now.getMonth() &&
               taskDate.getDate() === now.getDate();
    },

    filterTasks: (tasks, { query, status, date }) => {
        const now = new Date();
        const todayString = taskScheduler.toDateString(now);

        return tasks.filter(task => {
            // Long-term tasks are special
            if (task.isLongTerm) {
                if (date) return false; // Don't show long-term tasks when filtering by a specific date
                if (status === 'completed' && !task.completed) return false;
                if (status === 'overdue') return false; // Long-term tasks are never overdue
                if (query && !task.title.toLowerCase().includes(query.toLowerCase())) return false;
                return true;
            }

            // Status filter
            if (status) {
                if (status === 'completed' && !task.completed) return false;
                if (status === 'overdue' && !taskScheduler.isOverdue(task, now)) return false;
            }

            // aa date filter
            if (date) {
                if (!task.dueDate || taskScheduler.toDateString(new Date(task.dueDate)) !== date) {
                    return false;
                }
            }
            
            // Query filter
            if (query && !task.title.toLowerCase().includes(query.toLowerCase())) {
                return false;
            }

            return true;
        });
    },

    getTasksForDate: (tasks, dateString) => {
        return tasks.filter(task => 
            !task.isLongTerm && 
            task.dueDate && 
            taskScheduler.toDateString(new Date(task.dueDate)) === dateString
        );
    },

    getMarkedDates: (tasks, today = new Date()) => {
        const marked = {};
        const now = new Date();
        const todayString = taskScheduler.toDateString(today);

        tasks.forEach(task => {
            if (task.dueDate && !task.isLongTerm) {
                const dateString = taskScheduler.toDateString(new Date(task.dueDate));
                if (!marked[dateString]) {
                    marked[dateString] = { marked: true, dotColor: '#007AFF' }; // Default blue
                }
                // If any task on this day is overdue, mark it asred
                if (taskScheduler.isOverdue(task, now)) {
                    marked[dateString].dotColor = '#FF453A'; // Red for overdue
                }
            }
        });
        
        return marked;
    },

    getNotificationTime: (dueDateString) => {
        if (!dueDateString) return null;
        return new Date(dueDateString);
    }
};

export default taskScheduler;