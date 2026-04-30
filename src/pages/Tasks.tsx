import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle, Circle, AlertCircle, Calendar, Star, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, Link as LinkIcon, Lock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  importance: number;
  dependencies?: string[]; // IDs of tasks that must be completed first
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('yby_tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Deduplicate tasks by id
        const uniqueTasks = Array.from(new Map(parsedTasks.map((t: Task) => [t.id, t])).values());
        return uniqueTasks as Task[];
      } catch (e) {
        console.error('Failed to parse tasks', e);
      }
    }
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskImportance, setNewTaskImportance] = useState<number>(3);
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'smart' | 'priority' | 'importance' | 'dueDate'>('smart');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    localStorage.setItem('yby_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || undefined,
      importance: newTaskImportance,
      dependencies: newTaskDependencies.length > 0 ? newTaskDependencies : undefined,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setNewTaskImportance(3);
    setNewTaskDependencies([]);
    setIsAddingTask(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
      // Check for unfinished dependencies
      const unfinishedDeps = (task.dependencies || []).filter(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && !depTask.completed;
      });

      if (unfinishedDeps.length > 0) {
        // You could use a toast here. For now, let's just alert or prevent.
        alert(`Cannot complete task. Outstanding dependencies: ${unfinishedDeps.map(id => tasks.find(t => t.id === id)?.title).join(', ')}`);
        return;
      }
    }

    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const isTaskBlocked = (task: Task) => {
    if (task.completed) return false;
    return (task.dependencies || []).some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && !depTask.completed;
    });
  };

  const getDependencyTitles = (task: Task) => {
    return (task.dependencies || [])
      .map(id => tasks.find(t => t.id === id)?.title)
      .filter(Boolean) as string[];
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updatePriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      default: return 'text-gray-500 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getPriorityBorder = (priority: string, completed: boolean) => {
    if (completed) return 'border-l-gray-600 bg-black/40';
    switch (priority) {
      case 'high': return 'border-l-red-500 shadow-[-5px_0_20px_rgba(239,68,68,0.15)]';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ArrowUpCircle size={16} className="text-red-500" />;
      case 'medium': return <ArrowRightCircle size={16} className="text-yellow-500" />;
      case 'low': return <ArrowDownCircle size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const calculateTaskScore = (task: Task) => {
    let score = 0;
    
    // Priority weight (10, 20, 30)
    const priorityWeight = { high: 30, medium: 20, low: 10 };
    score += priorityWeight[task.priority];

    // Importance weight (10 to 50)
    score += (task.importance || 3) * 10;

    // Due date urgency (higher score for closer/overdue dates)
    if (task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        score += 100; // Overdue is highest priority
      } else if (diffDays === 0) {
        score += 80; // Due today
      } else if (diffDays <= 3) {
        score += 50; // Due soon
      } else if (diffDays <= 7) {
        score += 30; // Due this week
      } else {
        score += 10; // Due later
      }
    }

    return score;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    let diff = 0;
    if (sortBy === 'smart') {
      diff = calculateTaskScore(a) - calculateTaskScore(b);
    } else if (sortBy === 'priority') {
      const weight = { high: 3, medium: 2, low: 1 };
      diff = weight[a.priority] - weight[b.priority];
    } else if (sortBy === 'importance') {
      diff = a.importance - b.importance;
    } else if (sortBy === 'dueDate') {
      const getEpoch = (date?: string) => date ? new Date(date).getTime() : Infinity;
      diff = getEpoch(b.dueDate) - getEpoch(a.dueDate); // Default to Descending meaning soonest (smallest epoch) first, to align with typical sorting
    }

    return sortOrder === 'desc' ? -diff : diff;
  });

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-4xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] mb-4" style={{ textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>
            TASK_MANAGER
          </h1>
          <p className="text-gray-400 font-mono">Manage and prioritize system tasks.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(0,255,136,0.05)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Plus size={20} className="text-[#00ff88]" />
              NEW_TASK
            </h2>
            <button 
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="text-gray-500 hover:text-white transition-colors text-xs font-mono"
            >
              [ {isAddingTask ? 'CANCEL' : 'EXPAND'} ]
            </button>
          </div>

          <form onSubmit={addTask} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task objective..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-[#00ff88]/50 transition-colors font-mono"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors font-mono appearance-none"
              >
                <option value="low">PRIORITY: LOW</option>
                <option value="medium">PRIORITY: MED</option>
                <option value="high">PRIORITY: HIGH</option>
              </select>
            </div>

            {isAddingTask && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-gray-500 font-mono text-sm uppercase">Impact:</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newTaskImportance}
                      onChange={(e) => setNewTaskImportance(parseInt(e.target.value))}
                      className="flex-1 accent-[#00ff88]"
                    />
                    <span className="text-[#00ff88] font-mono font-bold w-12 text-right">{newTaskImportance}.0</span>
                  </div>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors font-mono"
                  />
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                  <label className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-3 block">Dependencies (Prerequisites)</label>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                    {tasks.filter(t => !t.completed).map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          if (newTaskDependencies.includes(task.id)) {
                            setNewTaskDependencies(newTaskDependencies.filter(id => id !== task.id));
                          } else {
                            setNewTaskDependencies([...newTaskDependencies, task.id]);
                          }
                        }}
                        className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all ${
                          newTaskDependencies.includes(task.id)
                            ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {task.title}
                      </button>
                    ))}
                    {tasks.filter(t => !t.completed).length === 0 && (
                      <span className="text-[10px] text-gray-700 font-mono italic">No available prerequisites.</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 hover:bg-[#00ff88]/20 hover:border-[#00ff88] px-6 py-4 rounded-xl font-black tracking-[0.3em] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase shadow-[0_0_20px_rgba(0,255,136,0.1)]"
            >
              {isAddingTask ? 'INITIALIZE_TASK' : 'QUICK_ADD'}
            </button>
          </form>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-white/5 border border-white/10 p-4 rounded-xl gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-mono text-xs uppercase tracking-widest">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[#00ff88] focus:outline-none focus:border-[#00ff88]/50 transition-colors font-mono appearance-none uppercase text-xs"
            >
              <option value="smart">Smart Action</option>
              <option value="priority">Priority</option>
              <option value="importance">Importance</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-4 py-1.5 text-white hover:bg-white/5 transition-colors font-mono text-xs uppercase"
          >
            {sortOrder === 'desc' ? 'Descending ↓' : 'Ascending ↑'}
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {sortedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all border-l-4 ${getPriorityBorder(task.priority, task.completed)} ${task.completed ? 'opacity-60 grayscale' : 'hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,255,136,0.05)]'}`}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`hover:scale-110 transition-transform flex-shrink-0 mt-1 sm:mt-0 ${task.completed ? 'text-gray-500' : isTaskBlocked(task) ? 'text-gray-700 cursor-not-allowed' : 'text-[#00ff88]'}`}
                >
                  {task.completed ? <CheckCircle size={24} /> : isTaskBlocked(task) ? <Lock size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!task.completed && getPriorityIcon(task.priority)}
                    <p className={`text-white font-mono break-words ${task.completed ? 'line-through text-gray-500' : 'font-semibold'} ${isTaskBlocked(task) ? 'text-gray-400' : ''}`}>
                      {task.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs font-mono text-gray-500">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !task.completed ? 'text-red-400' : ''}`}>
                        <Calendar size={12} /> {task.dueDate}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-purple-400">
                      <Star size={12} /> Lvl {task.importance || 3}
                    </span>
                    {task.dependencies && task.dependencies.length > 0 && !task.completed && (
                      <span className={`flex items-center gap-1 ${isTaskBlocked(task) ? 'text-yellow-500/70 animate-pulse' : 'text-blue-400/70'}`}>
                        <LinkIcon size={12} /> {task.dependencies.length} Deps
                      </span>
                    )}
                  </div>
                  {isTaskBlocked(task) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[10px] text-yellow-500/50 uppercase font-bold tracking-tighter">Blocks:</span>
                      {getDependencyTitles(task).map((title, idx) => (
                        <span key={idx} className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/60 px-2 py-0.5 rounded uppercase">
                          {title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  <select
                    value={task.priority}
                    onChange={(e) => updatePriority(task.id, e.target.value as 'low' | 'medium' | 'high')}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none ${getPriorityColor(task.priority)}`}
                  >
                    <option value="low" className="bg-gray-900 text-blue-500">Low</option>
                    <option value="medium" className="bg-gray-900 text-yellow-500">Medium</option>
                    <option value="high" className="bg-gray-900 text-red-500">High</option>
                  </select>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {tasks.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500 font-mono border border-dashed border-white/10 rounded-2xl"
              >
                <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>NO ACTIVE TASKS DETECTED</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
