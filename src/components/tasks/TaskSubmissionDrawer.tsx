"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  Link as LinkIcon,
  ExternalLink,
  Calendar,
  DollarSign,
  User,
  Building2,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { Task, TaskSubmission } from "@/types/api.types";
import taskService from "@/services/taskService";
import taskSubmissionService from "@/services/taskSubmissionService";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface TaskSubmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSuccess: () => void;
  resolvedNames?: {
    companyName?: string;
    serviceName?: string;
    tierName?: string;
    assigneeName?: string;
    rateUsd?: number;
  };
}

export default function TaskSubmissionDrawer({
  isOpen,
  onClose,
  task,
  onSuccess,
  resolvedNames,
}: TaskSubmissionDrawerProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Revision / Reject form state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Submit Work form state (Staff or Admin helper submission)
  const [showSubmitWork, setShowSubmitWork] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Approve confirmation modal state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadSubmissions = useCallback(async () => {
    if (!task) return;
    setLoadingSubmissions(true);
    try {
      const data = await taskSubmissionService.getSubmissionsByTaskId(task.id);
      setSubmissions(data);
    } catch {
      // Gracefully handled if no submissions exist yet
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && task) {
      loadSubmissions();
      setShowRevisionForm(false);
      setAdminFeedback("");
      setShowSubmitWork(false);
      setVideoUrl("");
      setSubmissionNotes("");
      setUploadFile(null);
    }
  }, [isOpen, task, loadSubmissions]);

  if (!task) return null;

  const companyDisplay =
    task.company?.companyName || resolvedNames?.companyName || "Client Account";
  const serviceDisplay =
    task.service?.name || resolvedNames?.serviceName || "Production Service";
  const tierDisplay = task.tier?.name || resolvedNames?.tierName || "Standard";
  const assigneeDisplay =
    task.assignedTo?.name || resolvedNames?.assigneeName || "Assigned Creator";
  const rateDisplay =
    task.rateLockedUsd ??
    resolvedNames?.rateUsd ??
    task.defaultRateUsd ??
    task.tier?.defaultRateUsd ??
    0;

  // Handle Task Approval
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await taskService.approveTask(task.id);
      toast.success(
        `Task "${task.title}" approved and locked into 10th-of-month payroll`,
        200
      );
      setShowApproveConfirm(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Request Revision
  const handleRejectWithFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFeedback.trim()) {
      toast.error("Please provide revision feedback for the creator.", 400);
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await taskService.rejectTask(task.id, {
        adminFeedback: adminFeedback.trim(),
      });
      toast.success("Revision requested. Task status set to REVISION.", 200);
      setShowRevisionForm(false);
      setAdminFeedback("");
      onSuccess();
      loadSubmissions();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle Submit Deliverable
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() && !uploadFile) {
      toast.error("Please provide either a video link or upload a file.", 400);
      return;
    }

    setIsSubmittingWork(true);
    try {
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        if (submissionNotes.trim()) formData.append("notes", submissionNotes.trim());
        await taskService.submitFile(task.id, formData);
      } else {
        await taskService.submitLink(task.id, {
          url: videoUrl.trim(),
          notes: submissionNotes.trim() || undefined,
        });
      }

      toast.success("Deliverable submitted. Task status set to SUBMITTED.", 201);
      setShowSubmitWork(false);
      setVideoUrl("");
      setUploadFile(null);
      setSubmissionNotes("");
      onSuccess();
      loadSubmissions();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B3B24] text-[#8CC63F] shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            APPROVED (PAYROLL LOCKED)
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            READY FOR REVIEW
          </span>
        );
      case "REVISION":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
            REVISION REQUESTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-bg-app border border-border-subtle text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            IN PROGRESS
          </span>
        );
    }
  };

  return (
    <SlidingDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Task Deliverable &amp; Submissions"
      subtitle={`Review versioned submissions, give feedback, and authorize payroll payout for "${task.title}".`}
      widthClass="w-full sm:max-w-xl lg:w-[48vw] lg:max-w-3xl"
    >
      <div className="space-y-6">
        {/* Status & Priority Ribbon */}
        <div className="p-4 rounded-2xl bg-bg-app border border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getStatusBadge(task.status)}
            {task.isUrgent && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                URGENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl">
            <DollarSign className="w-4 h-4" />
            <span>${Number(rateDisplay).toFixed(2)} USD</span>
          </div>
        </div>

        {/* Task Context Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-bg-app border border-border-subtle">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Client
            </span>
            <p className="font-bold text-text-primary mt-0.5 truncate flex items-center gap-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span>{companyDisplay}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-bg-app border border-border-subtle">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Creator
            </span>
            <p className="font-bold text-text-primary mt-0.5 truncate flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400" />
              <span>{assigneeDisplay}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-bg-app border border-border-subtle">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Deliverable Tier
            </span>
            <p className="font-bold text-text-primary mt-0.5 truncate">
              {serviceDisplay} • {tierDisplay}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-bg-app border border-border-subtle">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Posting Time
            </span>
            <p className="font-mono font-semibold text-text-primary mt-0.5 truncate flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>{task.postingDate} {task.postingTime}</span>
            </p>
          </div>
        </div>

        {/* Raw Assets URL Link */}
        {task.rawAssetsUrl && (
          <div className="p-3.5 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-3">
              <LinkIcon className="w-4 h-4 text-brand-accent shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Raw Footage &amp; Assets Folder
                </span>
                <p className="text-xs text-text-primary font-mono truncate">
                  {task.rawAssetsUrl}
                </p>
              </div>
            </div>
            <a
              href={task.rawAssetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-accent hover:text-brand-primary transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Open Folder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Creative Brief */}
        {task.brief && (
          <div className="p-4 rounded-xl bg-bg-app border border-border-subtle space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Creative Brief
            </span>
            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              {task.brief}
            </p>
          </div>
        )}

        {/* Versioned Submissions Timeline */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Versioned Submissions ({submissions.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitWork(!showSubmitWork)}
              className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
            >
              {showSubmitWork ? "Hide Deliverable Form" : "+ Upload / Link Deliverable"}
            </button>
          </div>

          {/* Inline Deliverable Submission Form */}
          {showSubmitWork && (
            <form
              onSubmit={handleSubmitWork}
              className="p-4 rounded-2xl bg-bg-app border border-brand-accent/40 space-y-4"
            >
              <p className="text-xs font-bold text-text-primary">
                Submit Finished Deliverable
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Finished Video URL (Google Drive, Vimeo, Frame.io)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/final-cut/view"
                  className="w-full h-10 px-3 rounded-xl border border-border-subtle text-xs font-mono outline-none bg-bg-surface focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Or Upload Script / Deliverable Document (PDF, DOC, DOCX)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setUploadFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-primary file:text-white hover:file:bg-brand-accent hover:file:text-brand-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Delivery Notes
                </label>
                <textarea
                  rows={2}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="e.g. Added Amharic subtitles and sound mix."
                  className="w-full p-2.5 rounded-xl border border-border-subtle text-xs outline-none bg-bg-surface resize-none focus:border-brand-accent"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitWork(false)}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWork}
                  className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {isSubmittingWork && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Deliverable</span>
                </button>
              </div>
            </form>
          )}

          {/* Submission Items */}
          {loadingSubmissions ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
              <span>Loading versioned submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-bg-app border border-border-subtle text-center text-gray-400 space-y-1">
              <UploadCloud className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-text-primary">
                No submissions received yet
              </p>
              <p className="text-[11px]">
                The creator has not yet submitted final video links or deliverables.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-bg-app border border-border-subtle space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      Version #{submissions.length - idx}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(sub.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {sub.videoUrl && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-xs font-mono truncate max-w-[80%] text-text-primary">
                        {sub.videoUrl}
                      </span>
                      <a
                        href={sub.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-brand-primary dark:text-brand-accent flex items-center gap-1 hover:underline"
                      >
                        <span>Open Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {sub.fileUrl && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-xs font-mono truncate max-w-[80%] text-text-primary">
                        Document Deliverable
                      </span>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-brand-primary dark:text-brand-accent flex items-center gap-1 hover:underline"
                      >
                        <span>Download</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {sub.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-bg-surface p-2.5 rounded-lg border border-border-subtle">
                      <span className="font-semibold text-text-primary">Notes: </span>
                      {sub.notes}
                    </p>
                  )}

                  {sub.adminFeedback && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                      <span className="font-bold">Admin Feedback: </span>
                      {sub.adminFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline Request Revision Feedback Form */}
        {showRevisionForm && (
          <form
            onSubmit={handleRejectWithFeedback}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Request Revisions from Staff Member
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Provide actionable feedback (e.g. timestamps, audio level adjustments, caption edits). Task turns Orange (REVISION).
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="e.g. Please slow down the cut at 0:14 and correct the website link in the lower third."
              className="w-full p-3 rounded-xl border border-amber-500/40 bg-bg-surface text-xs outline-none focus:ring-1 focus:ring-amber-500 resize-none text-text-primary"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Revision Request</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Admin Actions */}
        <div className="pt-6 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {task.status !== "APPROVED" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-bold transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Revision</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApproveConfirm(true)}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Add to Payroll</span>
                </button>
              </>
            )}

            {task.status === "APPROVED" && (
              <div className="flex items-center gap-2 text-xs font-bold text-brand-primary dark:text-brand-accent bg-[#0B3B24]/10 dark:bg-[#0B3B24]/40 px-3.5 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Task Approved &amp; Locked to 10th Payroll</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Final Approval */}
      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve Deliverable &amp; Authorize Payout"
        message={`Are you sure you want to approve "${task.title}"? This permanently marks the deliverable approved and schedules a $${Number(rateDisplay).toFixed(2)} USD payout for ${assigneeDisplay} in the upcoming payroll cycle.`}
        warningNote="Once approved, the task rate is locked and added to the 10th-of-month cycle summary."
        confirmText="Approve & Lock Payroll"
        confirmVariant="warning"
        isLoading={isApproving}
      />
    </SlidingDrawer>
  );
}
