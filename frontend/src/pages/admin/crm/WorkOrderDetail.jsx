import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { crmAPI, engineerAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { 
    ArrowLeft, 
    Briefcase, 
    MessageSquare, 
    CheckSquare, 
    Clock, 
    User,
    Calendar,
    Plus,
    Send,
    Check,
    Circle,
    ChevronRight,
    Loader2,
    AlertCircle,
    Package,
    Truck,
    Wrench,
    TestTube,
    PlayCircle,
    Flag
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '../../../lib/utils';

// Project stages with their metadata
const PROJECT_STAGES = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-100' },
    { key: 'boq', label: 'BOQ', icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { key: 'procurement', label: 'Procurement', icon: Briefcase, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    { key: 'material_delivered', label: 'Material Delivered', icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-100' },
    { key: 'installation', label: 'Installation', icon: Wrench, color: 'text-orange-500', bgColor: 'bg-orange-100' },
    { key: 'testing', label: 'Testing', icon: TestTube, color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
    { key: 'commissioning', label: 'Commissioning', icon: PlayCircle, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
    { key: 'ready', label: 'Ready', icon: Flag, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
];

const TASK_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
];

export default function WorkOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [workOrder, setWorkOrder] = useState(null);
    const [comments, setComments] = useState([]);
    const [stageHistory, setStageHistory] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [engineers, setEngineers] = useState([]);
    
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        stage: ''
    });
    
    const [stageNotes, setStageNotes] = useState('');
    const [selectedStage, setSelectedStage] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [woRes, engineersRes] = await Promise.all([
                crmAPI.getWorkOrderDetail(id),
                engineerAPI.getAll()
            ]);
            
            setWorkOrder(woRes.data.work_order);
            setComments(woRes.data.comments || []);
            setStageHistory(woRes.data.history || []);
            setTasks(woRes.data.tasks || []);
            setEngineers(engineersRes.data);
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('Work order not found');
                navigate('/admin/crm/work-orders');
            } else {
                toast.error('Failed to load work order details');
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getCurrentStageIndex = () => {
        if (!workOrder) return 0;
        return PROJECT_STAGES.findIndex(s => s.key === workOrder.status);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        setSubmittingComment(true);
        try {
            await crmAPI.addComment(id, newComment.trim());
            setNewComment('');
            toast.success('Comment added');
            loadData();
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleUpdateStage = async () => {
        if (!selectedStage) return;
        
        setSubmitting(true);
        try {
            await crmAPI.updateWorkOrderStage(id, selectedStage, stageNotes);
            toast.success(`Stage updated to ${PROJECT_STAGES.find(s => s.key === selectedStage)?.label}`);
            setShowStageModal(false);
            setStageNotes('');
            setSelectedStage('');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update stage');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateTask = async () => {
        if (!taskForm.title || !taskForm.assigned_to) {
            toast.error('Please fill required fields');
            return;
        }
        
        setSubmitting(true);
        try {
            await crmAPI.createTask({
                work_order_id: id,
                ...taskForm
            });
            toast.success('Task created');
            setShowTaskModal(false);
            setTaskForm({ title: '', description: '', assigned_to: '', due_date: '', stage: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await crmAPI.updateTask(taskId, { status: newStatus });
            toast.success('Task updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const getNextStages = () => {
        const currentIndex = getCurrentStageIndex();
        // Can only go forward or stay (no backwards)
        return PROJECT_STAGES.filter((_, index) => index > currentIndex);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (!workOrder) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Work order not found</p>
                    <Button onClick={() => navigate('/admin/crm/work-orders')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Work Orders
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    const currentStageIndex = getCurrentStageIndex();

    return (
        <AdminLayout>
            <div className="space-y-6" data-testid="work-order-detail-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate('/admin/crm/work-orders')}
                        data-testid="back-btn"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-heading font-bold">{workOrder.work_order_number}</h1>
                            <Badge className={PROJECT_STAGES[currentStageIndex]?.bgColor + ' ' + PROJECT_STAGES[currentStageIndex]?.color}>
                                {PROJECT_STAGES[currentStageIndex]?.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{workOrder.lead_name}</p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedStage('');
                            setStageNotes('');
                            setShowStageModal(true);
                        }}
                        disabled={workOrder.status === 'ready' || workOrder.status === 'converted_to_amc'}
                        data-testid="update-stage-btn"
                    >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Update Stage
                    </Button>
                </div>

                {/* Project Timeline */}
                <Card data-testid="project-timeline">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Project Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            {/* Desktop Timeline */}
                            <div className="hidden md:flex items-center justify-between">
                                {PROJECT_STAGES.map((stage, index) => {
                                    const isCompleted = index < currentStageIndex;
                                    const isCurrent = index === currentStageIndex;
                                    const StageIcon = stage.icon;
                                    
                                    return (
                                        <div key={stage.key} className="flex flex-col items-center relative flex-1">
                                            {/* Connector Line */}
                                            {index > 0 && (
                                                <div className={cn(
                                                    "absolute top-5 right-1/2 w-full h-0.5",
                                                    isCompleted ? "bg-primary" : "bg-border"
                                                )} style={{ zIndex: 0 }} />
                                            )}
                                            
                                            {/* Stage Circle */}
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all",
                                                isCompleted && "bg-primary text-white",
                                                isCurrent && "bg-primary text-white ring-4 ring-primary/20",
                                                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                            )}>
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <StageIcon className="h-5 w-5" />
                                                )}
                                            </div>
                                            
                                            {/* Stage Label */}
                                            <span className={cn(
                                                "mt-2 text-xs text-center font-medium",
                                                isCurrent && "text-primary",
                                                !isCompleted && !isCurrent && "text-muted-foreground"
                                            )}>
                                                {stage.label}
                                            </span>
                                            
                                            {/* History Info */}
                                            {stageHistory.find(h => h.stage === stage.key) && (
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    {formatDate(stageHistory.find(h => h.stage === stage.key)?.created_at)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Mobile Timeline */}
                            <div className="md:hidden space-y-3">
                                {PROJECT_STAGES.map((stage, index) => {
                                    const isCompleted = index < currentStageIndex;
                                    const isCurrent = index === currentStageIndex;
                                    const StageIcon = stage.icon;
                                    const historyEntry = stageHistory.find(h => h.stage === stage.key);
                                    
                                    return (
                                        <div key={stage.key} className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                isCompleted && "bg-primary text-white",
                                                isCurrent && "bg-primary text-white ring-2 ring-primary/20",
                                                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                            )}>
                                                {isCompleted ? <Check className="h-4 w-4" /> : <StageIcon className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    isCurrent && "text-primary"
                                                )}>{stage.label}</p>
                                                {historyEntry && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(historyEntry.created_at)} by {historyEntry.changed_by_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Work Order Details */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Customer</p>
                                <p className="font-medium">{workOrder.lead_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Scope of Work</p>
                                <p className="text-sm">{workOrder.scope_of_work}</p>
                            </div>
                            {workOrder.quotation_total && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Project Value</p>
                                    <p className="font-semibold text-primary">₹{workOrder.quotation_total.toLocaleString()}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Expected Start</p>
                                    <p className="text-sm">{formatDate(workOrder.expected_start_date) || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Expected End</p>
                                    <p className="text-sm">{formatDate(workOrder.expected_end_date) || '-'}</p>
                                </div>
                            </div>
                            {workOrder.notes && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Notes</p>
                                    <p className="text-sm">{workOrder.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tasks Section */}
                    <Card className="md:col-span-2" data-testid="tasks-section">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" />
                                Tasks
                            </CardTitle>
                            <Button 
                                size="sm" 
                                onClick={() => {
                                    setTaskForm({ title: '', description: '', assigned_to: '', due_date: '', stage: workOrder.status });
                                    setShowTaskModal(true);
                                }}
                                data-testid="add-task-btn"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Task
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {tasks.length > 0 ? (
                                <div className="space-y-3">
                                    {tasks.map((task) => (
                                        <div 
                                            key={task.id} 
                                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                            data-testid={`task-${task.id}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{task.title}</p>
                                                        {task.stage && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {PROJECT_STAGES.find(s => s.key === task.stage)?.label || task.stage}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {task.assigned_to_name}
                                                        </span>
                                                        {task.due_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatDate(task.due_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Select
                                                    value={task.status}
                                                    onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                                                >
                                                    <SelectTrigger className="w-32 h-8" data-testid={`task-status-${task.id}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TASK_STATUS_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No tasks yet. Add tasks to track work.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Comments Section */}
                <Card data-testid="comments-section">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Comments & Updates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Add Comment */}
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Add a comment or update..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                                data-testid="comment-input"
                            />
                            <Button 
                                onClick={handleAddComment} 
                                disabled={submittingComment || !newComment.trim()}
                                data-testid="submit-comment-btn"
                            >
                                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        
                        {/* Comments List */}
                        {comments.length > 0 ? (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-medium text-primary">
                                                {comment.user_name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{comment.user_name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(comment.created_at, true)}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{comment.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-muted-foreground">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No comments yet. Start the conversation!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Update Stage Modal */}
                <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Update Project Stage</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Current Stage: <span className="font-medium">{PROJECT_STAGES[currentStageIndex]?.label}</span>
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Move to Stage *</Label>
                                <Select value={selectedStage} onValueChange={setSelectedStage}>
                                    <SelectTrigger data-testid="stage-select">
                                        <SelectValue placeholder="Select next stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getNextStages().map(stage => (
                                            <SelectItem key={stage.key} value={stage.key}>
                                                <div className="flex items-center gap-2">
                                                    <stage.icon className={cn("h-4 w-4", stage.color)} />
                                                    {stage.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    placeholder="Add notes about this stage change..."
                                    value={stageNotes}
                                    onChange={(e) => setStageNotes(e.target.value)}
                                    rows={3}
                                    data-testid="stage-notes"
                                />
                            </div>
                            
                            <Button 
                                className="w-full" 
                                onClick={handleUpdateStage}
                                disabled={submitting || !selectedStage}
                                data-testid="confirm-stage-btn"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                Update Stage
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Task Modal */}
                <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Task Title *</Label>
                                <Input
                                    placeholder="Enter task title"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    data-testid="task-title-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Task description"
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    rows={2}
                                    data-testid="task-desc-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Assign To *</Label>
                                <Select
                                    value={taskForm.assigned_to}
                                    onValueChange={(value) => setTaskForm({ ...taskForm, assigned_to: value })}
                                >
                                    <SelectTrigger data-testid="task-assignee-select">
                                        <SelectValue placeholder="Select engineer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {engineers.map(eng => (
                                            <SelectItem key={eng.id} value={eng.id}>{eng.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={taskForm.due_date}
                                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                        data-testid="task-due-date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stage</Label>
                                    <Select
                                        value={taskForm.stage}
                                        onValueChange={(value) => setTaskForm({ ...taskForm, stage: value })}
                                    >
                                        <SelectTrigger data-testid="task-stage-select">
                                            <SelectValue placeholder="Select stage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_STAGES.map(stage => (
                                                <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <Button 
                                className="w-full" 
                                onClick={handleCreateTask}
                                disabled={submitting || !taskForm.title || !taskForm.assigned_to}
                                data-testid="confirm-task-btn"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create Task
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
